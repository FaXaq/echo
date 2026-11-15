import type { DeleteOrphanedFilesCommandPortFactory } from "./delete-orphaned-files.command.port.js";

export const deleteOrphanedFilesCommandFactory: DeleteOrphanedFilesCommandPortFactory =
  () => async (db, scope, input) => {
    if (input.fileIds.length === 0) return [];

    const rows = await db
      .deleteFrom("file")
      .where("file.id", "in", input.fileIds)
      .where("file.organization_id", "=", scope.organizationId)
      .where(({ and, not, exists, selectFrom }) =>
        and([
          not(
            exists(
              selectFrom("event_file")
                .select("event_file.file_id")
                .whereRef("event_file.file_id", "=", "file.id"),
            ),
          ),
          not(
            exists(
              selectFrom("song_file")
                .select("song_file.file_id")
                .whereRef("song_file.file_id", "=", "file.id"),
            ),
          ),
          not(
            exists(
              selectFrom("folder_file")
                .select("folder_file.file_id")
                .whereRef("folder_file.file_id", "=", "file.id"),
            ),
          ),
        ]),
      )
      .returning(["file.id", "file.s3_key", "file.mime_type"])
      .execute();

    return rows.map((row) => ({ id: row.id, s3Key: row.s3_key, mimeType: row.mime_type }));
  };
