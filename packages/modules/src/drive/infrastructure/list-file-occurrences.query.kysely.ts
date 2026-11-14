import { sql } from "kysely";
import { eventFolderName, type PlaceLabel } from "../domain/index.js";
import type { ListFileOccurrencesQueryPortFactory } from "./list-file-occurrences.query.port.js";

type Dated = { at: Date; label: PlaceLabel };

export const listFileOccurrencesQueryFactory: ListFileOccurrencesQueryPortFactory =
  () => async (db, scope, input) => {
    const folderRows = await sql<{ id: string | null; at: Date; path: string[] | null }>`
    WITH RECURSIVE folder_path AS (
      SELECT id, name, parent_folder_id, ARRAY[name] AS path
      FROM folder
      WHERE organization_id = ${scope.organizationId} AND parent_folder_id IS NULL
      UNION ALL
      SELECT f.id, f.name, f.parent_folder_id, fp.path || f.name
      FROM folder f
      INNER JOIN folder_path fp ON f.parent_folder_id = fp.id
    )
    SELECT folder_file.folder_id AS id, folder_file.placed_at AS at, folder_path.path
    FROM folder_file
    INNER JOIN file ON file.id = folder_file.file_id AND file.organization_id = ${scope.organizationId}
    LEFT JOIN folder_path ON folder_path.id = folder_file.folder_id
    WHERE folder_file.file_id = ${input.fileId}
  `.execute(db);

    const eventRows = await db
      .selectFrom("event_file")
      .innerJoin("calendar_event", "calendar_event.id", "event_file.event_id")
      .innerJoin("file", "file.id", "event_file.file_id")
      .select([
        "calendar_event.id",
        "calendar_event.title",
        "calendar_event.start_date",
        "event_file.linked_at as at",
      ])
      .where("event_file.file_id", "=", input.fileId)
      .where("file.organization_id", "=", scope.organizationId)
      .execute();

    const songRows = await db
      .selectFrom("song_file")
      .innerJoin("song", "song.id", "song_file.song_id")
      .innerJoin("file", "file.id", "song_file.file_id")
      .select(["song.id", "song.title", "song_file.linked_at as at"])
      .where("song_file.file_id", "=", input.fileId)
      .where("file.organization_id", "=", scope.organizationId)
      .execute();

    const occurrences: Dated[] = [
      ...folderRows.rows.map((row): Dated => ({
        at: row.at,
        label: {
          place: row.id === null ? { kind: "root" } : { kind: "folder", id: row.id },
          path: row.path ?? [],
        },
      })),
      ...eventRows.map((row): Dated => ({
        at: row.at,
        label: {
          place: { kind: "event", id: row.id },
          path: ["Events", eventFolderName({ title: row.title, startDate: row.start_date })],
        },
      })),
      ...songRows.map((row): Dated => ({
        at: row.at,
        label: { place: { kind: "song", id: row.id }, path: ["Songs", row.title] },
      })),
    ];

    return occurrences.sort((a, b) => a.at.getTime() - b.at.getTime()).map((o) => o.label);
  };
