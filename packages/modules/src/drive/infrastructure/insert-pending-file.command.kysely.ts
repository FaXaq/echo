import type { InsertPendingFileCommandPortFactory } from "./insert-pending-file.command.port.js";
import { toFileRecord } from "./map-file.js";

export const insertPendingFileCommandFactory: InsertPendingFileCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .insertInto("file")
      .values({
        id: input.id,
        event_id: input.eventId,
        folder_id: input.folderId,
        organization_id: scope.organizationId,
        uploaded_by: input.uploadedBy,
        kind: input.kind,
        mime_type: input.mimeType,
        size_bytes: input.sizeBytes,
        filename: input.originalFilename,
        original_filename: input.originalFilename,
        s3_key: input.s3Key,
        status: "pending",
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    const { name } = await db
      .selectFrom("user")
      .select("name")
      .where("user.id", "=", row.uploaded_by)
      .executeTakeFirstOrThrow();

    return toFileRecord({ ...row, uploaded_by_name: name });
  };
