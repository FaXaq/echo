import { sql } from "kysely";
import { eventFolderName, type Place } from "../domain/index.js";
import type { SearchDriveQueryPortFactory, SearchDriveResult } from "./search-drive.query.port.js";
import { toFileRecord, type FileRow } from "./map-file.js";

const SEARCH_RESULT_LIMIT = 10;

type FileSearchRow = FileRow & {
  occurrence_kind: "folder" | "event" | "song" | null;
  occurrence_place_id: string | null;
  folder_path: string[] | null;
  event_title: string | null;
  event_start_date: Date | null;
  song_title: string | null;
};

const occurrenceOf = (row: FileSearchRow): { location: Place; path: string[] } => {
  if (row.occurrence_kind === "event" && row.occurrence_place_id !== null) {
    return {
      location: { kind: "event", id: row.occurrence_place_id },
      path: [
        "Events",
        eventFolderName({
          title: row.event_title ?? "",
          startDate: row.event_start_date ?? new Date(0),
        }),
      ],
    };
  }
  if (row.occurrence_kind === "song" && row.occurrence_place_id !== null) {
    return {
      location: { kind: "song", id: row.occurrence_place_id },
      path: ["Songs", row.song_title ?? ""],
    };
  }
  if (row.occurrence_kind === "folder" && row.occurrence_place_id !== null) {
    return {
      location: { kind: "folder", id: row.occurrence_place_id },
      path: row.folder_path ?? [],
    };
  }
  return { location: { kind: "root" }, path: [] };
};

export const searchDriveQueryFactory: SearchDriveQueryPortFactory =
  () => async (db, scope, input) => {
    const folderRows = await sql<{ id: string; name: string; path: string[] }>`
    WITH RECURSIVE folder_path AS (
      SELECT id, name, parent_folder_id, ARRAY[name] AS path
      FROM folder
      WHERE organization_id = ${scope.organizationId} AND parent_folder_id IS NULL
      UNION ALL
      SELECT f.id, f.name, f.parent_folder_id, fp.path || f.name
      FROM folder f
      INNER JOIN folder_path fp ON f.parent_folder_id = fp.id
    )
    SELECT folder.id, folder.name, COALESCE(parent_fp.path, ARRAY[]::text[]) AS path
    FROM folder
    LEFT JOIN folder_path parent_fp ON parent_fp.id = folder.parent_folder_id
    WHERE folder.organization_id = ${scope.organizationId}
      AND strpos(lower(folder.name), lower(${input.query})) > 0
    ORDER BY folder.name ASC
    LIMIT ${SEARCH_RESULT_LIMIT}
  `.execute(db);

    const eventRows = await db
      .selectFrom("calendar_event")
      .select(["id", "title", "start_date"])
      .where("organization_id", "=", scope.organizationId)
      .where(sql<boolean>`strpos(lower(title), lower(${input.query})) > 0`)
      .orderBy("title")
      .limit(SEARCH_RESULT_LIMIT)
      .execute();

    const songRows = await db
      .selectFrom("song")
      .select(["id", "title"])
      .where("organization_id", "=", scope.organizationId)
      .where(sql<boolean>`strpos(lower(title), lower(${input.query})) > 0`)
      .orderBy("title")
      .limit(SEARCH_RESULT_LIMIT)
      .execute();

    const fileRows = await sql<FileSearchRow>`
    WITH RECURSIVE folder_path AS (
      SELECT id, name, parent_folder_id, ARRAY[name] AS path
      FROM folder
      WHERE organization_id = ${scope.organizationId} AND parent_folder_id IS NULL
      UNION ALL
      SELECT f.id, f.name, f.parent_folder_id, fp.path || f.name
      FROM folder f
      INNER JOIN folder_path fp ON f.parent_folder_id = fp.id
    ),
    matched AS (
      SELECT file.*, "user".name AS uploaded_by_name
      FROM file
      INNER JOIN "user" ON "user".id = file.uploaded_by
      WHERE file.organization_id = ${scope.organizationId}
        AND file.status = 'uploaded'
        AND strpos(lower(file.filename), lower(${input.query})) > 0
      ORDER BY file.filename ASC
      LIMIT ${SEARCH_RESULT_LIMIT}
    ),
    oldest AS (
      SELECT DISTINCT ON (file_id) file_id, kind, place_id
      FROM (
        SELECT file_id, placed_at AS at, 'folder' AS kind, folder_id AS place_id FROM folder_file
        UNION ALL
        SELECT file_id, linked_at AS at, 'event' AS kind, event_id AS place_id FROM event_file
        UNION ALL
        SELECT file_id, linked_at AS at, 'song' AS kind, song_id AS place_id FROM song_file
      ) occurrence
      WHERE file_id IN (SELECT id FROM matched)
      ORDER BY file_id, at ASC, kind ASC, place_id ASC
    )
    SELECT matched.*,
      oldest.kind AS occurrence_kind,
      oldest.place_id AS occurrence_place_id,
      folder_path.path AS folder_path,
      calendar_event.title AS event_title,
      calendar_event.start_date AS event_start_date,
      song.title AS song_title
    FROM matched
    LEFT JOIN oldest ON oldest.file_id = matched.id
    LEFT JOIN folder_path ON oldest.kind = 'folder' AND folder_path.id = oldest.place_id
    LEFT JOIN calendar_event ON oldest.kind = 'event' AND calendar_event.id = oldest.place_id
    LEFT JOIN song ON oldest.kind = 'song' AND song.id = oldest.place_id
    ORDER BY matched.filename ASC
  `.execute(db);

    const folders: SearchDriveResult["folders"] = [
      ...folderRows.rows.map((row) => ({
        location: { kind: "folder" as const, id: row.id },
        name: row.name,
        path: row.path,
      })),
      ...eventRows.map((row) => ({
        location: { kind: "event" as const, id: row.id },
        name: eventFolderName({ title: row.title, startDate: row.start_date }),
        path: ["Events"],
      })),
      ...songRows.map((row) => ({
        location: { kind: "song" as const, id: row.id },
        name: row.title,
        path: ["Songs"],
      })),
    ]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, SEARCH_RESULT_LIMIT);

    return {
      folders,
      files: fileRows.rows.map((row) => ({ ...toFileRecord(row), ...occurrenceOf(row) })),
    };
  };
