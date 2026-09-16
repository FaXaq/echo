import type { FindOrphanedFilesForEventQueryPortFactory } from "./find-orphaned-files-for-event.query.port.js";
import { toFileRecord } from "./map-file.js";

export const findOrphanedFilesForEventQueryFactory: FindOrphanedFilesForEventQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .selectAll("file")
      .select("user.name as uploaded_by_name")
      .where("file.event_id", "=", input.eventId)
      .where("file.organization_id", "=", scope.organizationId)
      .where(({ not, exists, selectFrom }) =>
        not(
          exists(
            selectFrom("song_file")
              .select("song_file.song_id")
              .whereRef("song_file.file_id", "=", "file.id"),
          ),
        ),
      )
      .execute();

    return rows.map((row) => toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
  };
