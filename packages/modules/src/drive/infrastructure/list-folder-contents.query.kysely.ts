import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import {
  eventFolderName,
  type DriveLocation,
  type FolderPlace,
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

const byName = (order: DriveSortOrder) => (a: SystemFolderEntry, b: SystemFolderEntry) =>
  order === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);

const listUserFolders = async (
  db: KyselyDB,
  scope: OrganizationScope,
  place: FolderPlace,
  sort: { field: string; order: DriveSortOrder },
) => {
  const query = db
    .selectFrom("folder")
    .selectAll()
    .where("organization_id", "=", scope.organizationId);
  const rows = await (
    place.kind === "root"
      ? query.where("parent_folder_id", "is", null)
      : query.where("parent_folder_id", "=", place.id)
  )
    // Folders have no size — any field besides updatedAt falls back to name.
    .orderBy(sort.field === "updatedAt" ? "updated_at" : "name", sort.order)
    .execute();
  return rows.map(toFolderRecord);
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

const listSystemFolders = async (
  db: KyselyDB,
  scope: OrganizationScope,
  location: DriveLocation,
): Promise<SystemFolderEntry[]> => {
  if (location.kind === "events") {
    const rows = await db
      .selectFrom("calendar_event")
      .select(["id", "title", "start_date"])
      .where("organization_id", "=", scope.organizationId)
      .execute();
    return rows.map((row) => ({
      location: { kind: "event", id: row.id },
      name: eventFolderName({ title: row.title, startDate: row.start_date }),
    }));
  }
  if (location.kind === "songs") {
    const rows = await db
      .selectFrom("song")
      .select(["id", "title"])
      .where("organization_id", "=", scope.organizationId)
      .execute();
    return rows.map((row) => ({ location: { kind: "song", id: row.id }, name: row.title }));
  }
  return [];
};

export const listFolderContentsQueryFactory: ListFolderContentsQueryPortFactory =
  () => async (db, scope, input) => {
    const { location, sort } = input;
    const [folders, systemFolders, files] = await Promise.all([
      location.kind === "root" || location.kind === "folder"
        ? listUserFolders(db, scope, location, sort)
        : [],
      listSystemFolders(db, scope, location),
      listFiles(db, scope, location, sort),
    ]);

    return { folders, systemFolders: systemFolders.sort(byName(sort.order)), files };
  };
