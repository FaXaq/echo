import type { KyselyDB } from "@echo/db";
import { sql } from "kysely";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import {
  ROOT_SYSTEM_FOLDERS,
  eventFolderName,
  type DriveLocation,
  type FolderPlace,
  type FolderWithSize,
  type SystemFolderEntry,
} from "../domain/index.js";
import type {
  DriveSortOrder,
  ListFolderContentsQueryPortFactory,
} from "./list-folder-contents.query.port.js";
import { toFolderRecord } from "./map-folder.js";
import { toFileRecord } from "./map-file.js";

const FILE_SORT_COLUMN = {
  name: "file.filename",
  updatedAt: "file.updated_at",
  sizeBytes: "file.size_bytes",
} as const;

type SortInput = { field: string; order: DriveSortOrder };
type Sized = { name: string; sizeBytes: number };

const bySort = (sort: SortInput) => (a: Sized, b: Sized) => {
  const direction = sort.order === "asc" ? 1 : -1;
  const bySize = sort.field === "sizeBytes" ? a.sizeBytes - b.sizeBytes : 0;
  return direction * (bySize || a.name.localeCompare(b.name));
};

const listFolderSizes = async (db: KyselyDB, scope: OrganizationScope, place: FolderPlace) => {
  const seed =
    place.kind === "root" ? sql`parent_folder_id is null` : sql`parent_folder_id = ${place.id}`;
  const { rows } = await sql<{ root_id: string; total: string }>`
    with recursive tree as (
      select id, id as root_id from folder where organization_id = ${scope.organizationId} and ${seed}
      union all
      select f.id, t.root_id from folder f inner join tree t on f.parent_folder_id = t.id
    )
    select sized.root_id, sum(sized.size_bytes) as total
    from (
      select distinct tree.root_id, file.id, file.size_bytes
      from tree
      inner join folder_file on folder_file.folder_id = tree.id
      inner join file on file.id = folder_file.file_id
      where file.organization_id = ${scope.organizationId} and file.status = 'uploaded'
    ) sized
    group by sized.root_id
  `.execute(db);
  return new Map(rows.map((row) => [row.root_id, Number(row.total)]));
};

const listUserFolders = async (
  db: KyselyDB,
  scope: OrganizationScope,
  place: FolderPlace,
  sort: SortInput,
): Promise<FolderWithSize[]> => {
  const query = db
    .selectFrom("folder")
    .selectAll()
    .where("organization_id", "=", scope.organizationId);
  const [rows, sizes] = await Promise.all([
    (place.kind === "root"
      ? query.where("parent_folder_id", "is", null)
      : query.where("parent_folder_id", "=", place.id)
    )
      .orderBy(sort.field === "updatedAt" ? "updated_at" : "name", sort.order)
      .execute(),
    listFolderSizes(db, scope, place),
  ]);
  const folders = rows.map((row) => ({
    ...toFolderRecord(row),
    sizeBytes: sizes.get(row.id) ?? 0,
  }));
  return sort.field === "sizeBytes" ? folders.sort(bySort(sort)) : folders;
};

const placedFileIds = (db: KyselyDB, location: DriveLocation) => {
  switch (location.kind) {
    case "root":
      return db.selectFrom("folder_file").select("file_id").where("folder_id", "is", null);
    case "folder":
      return db.selectFrom("folder_file").select("file_id").where("folder_id", "=", location.id);
    case "event":
      return db.selectFrom("event_file").select("file_id").where("event_id", "=", location.id);
    case "song":
      return db.selectFrom("song_file").select("file_id").where("song_id", "=", location.id);
    case "events":
    case "songs":
      return null;
  }
};

const listFiles = async (
  db: KyselyDB,
  scope: OrganizationScope,
  location: DriveLocation,
  sort: { field: keyof typeof FILE_SORT_COLUMN; order: DriveSortOrder },
) => {
  const fileIds = placedFileIds(db, location);
  if (!fileIds) return [];
  const rows = await db
    .selectFrom("file")
    .innerJoin("user", "file.uploaded_by", "user.id")
    .selectAll("file")
    .select("user.name as uploaded_by_name")
    .where("file.organization_id", "=", scope.organizationId)
    .where("file.id", "in", fileIds)
    .orderBy(FILE_SORT_COLUMN[sort.field], sort.order)
    .execute();
  return rows.map(toFileRecord);
};

const listRootSystemFolders = async (
  db: KyselyDB,
  scope: OrganizationScope,
): Promise<SystemFolderEntry[]> => {
  const totals = await db
    .selectFrom("file")
    .where("organization_id", "=", scope.organizationId)
    .where("status", "=", "uploaded")
    .select([
      sql<string>`coalesce(sum(size_bytes) filter (where id in (select file_id from event_file)), 0)`.as(
        "events",
      ),
      sql<string>`coalesce(sum(size_bytes) filter (where id in (select file_id from song_file)), 0)`.as(
        "songs",
      ),
    ])
    .executeTakeFirst();
  return ROOT_SYSTEM_FOLDERS.map((entry) => ({
    ...entry,
    sizeBytes: Number(entry.location.kind === "events" ? totals?.events : totals?.songs) || 0,
  }));
};

const listEventFolders = async (
  db: KyselyDB,
  scope: OrganizationScope,
  sort: SortInput,
): Promise<SystemFolderEntry[]> => {
  const [rows, sizes] = await Promise.all([
    db
      .selectFrom("calendar_event")
      .select(["id", "title", "start_date"])
      .where("organization_id", "=", scope.organizationId)
      .execute(),
    db
      .selectFrom("event_file")
      .innerJoin("file", "file.id", "event_file.file_id")
      .where("file.organization_id", "=", scope.organizationId)
      .where("file.status", "=", "uploaded")
      .select(["event_file.event_id as owner_id", sql<string>`sum(file.size_bytes)`.as("total")])
      .groupBy("event_file.event_id")
      .execute(),
  ]);
  const sizeById = new Map(sizes.map((row) => [row.owner_id, Number(row.total)]));
  return rows
    .map((row): SystemFolderEntry => ({
      location: { kind: "event", id: row.id },
      name: eventFolderName({ title: row.title, startDate: row.start_date }),
      sizeBytes: sizeById.get(row.id) ?? 0,
    }))
    .sort(bySort(sort));
};

const listSongFolders = async (
  db: KyselyDB,
  scope: OrganizationScope,
  sort: SortInput,
): Promise<SystemFolderEntry[]> => {
  const [rows, sizes] = await Promise.all([
    db
      .selectFrom("song")
      .select(["id", "title"])
      .where("organization_id", "=", scope.organizationId)
      .execute(),
    db
      .selectFrom("song_file")
      .innerJoin("file", "file.id", "song_file.file_id")
      .where("file.organization_id", "=", scope.organizationId)
      .where("file.status", "=", "uploaded")
      .select(["song_file.song_id as owner_id", sql<string>`sum(file.size_bytes)`.as("total")])
      .groupBy("song_file.song_id")
      .execute(),
  ]);
  const sizeById = new Map(sizes.map((row) => [row.owner_id, Number(row.total)]));
  return rows
    .map((row): SystemFolderEntry => ({
      location: { kind: "song", id: row.id },
      name: row.title,
      sizeBytes: sizeById.get(row.id) ?? 0,
    }))
    .sort(bySort(sort));
};

const listSystemFolders = (
  db: KyselyDB,
  scope: OrganizationScope,
  location: DriveLocation,
  sort: SortInput,
) => {
  switch (location.kind) {
    case "root":
      return listRootSystemFolders(db, scope);
    case "events":
      return listEventFolders(db, scope, sort);
    case "songs":
      return listSongFolders(db, scope, sort);
    default:
      return [];
  }
};

export const listFolderContentsQueryFactory: ListFolderContentsQueryPortFactory =
  () => async (db, scope, input) => {
    const { location, sort } = input;
    const [folders, systemFolders, files] = await Promise.all([
      location.kind === "root" || location.kind === "folder"
        ? listUserFolders(db, scope, location, sort)
        : [],
      listSystemFolders(db, scope, location, sort),
      listFiles(db, scope, location, sort),
    ]);

    return { folders, systemFolders, files };
  };
