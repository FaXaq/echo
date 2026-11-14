import type { KyselyDB } from "@echo/db";
import type { Place } from "../domain/index.js";
import type { InsertPendingFileCommandPortFactory } from "./insert-pending-file.command.port.js";
import { toFileRecord } from "./map-file.js";

async function insertOccurrence(trx: KyselyDB, fileId: string, place: Place, userId: string) {
  switch (place.kind) {
    case "root":
    case "folder":
      await trx
        .insertInto("folder_file")
        .values({
          file_id: fileId,
          folder_id: place.kind === "folder" ? place.id : null,
          placed_by: userId,
        })
        .execute();
      return;
    case "event":
      await trx
        .insertInto("event_file")
        .values({ event_id: place.id, file_id: fileId, linked_by: userId })
        .execute();
      return;
    case "song":
      await trx
        .insertInto("song_file")
        .values({ song_id: place.id, file_id: fileId, linked_by: userId })
        .execute();
  }
}

export const insertPendingFileCommandFactory: InsertPendingFileCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db.transaction().execute(async (trx) => {
      const inserted = await trx
        .insertInto("file")
        .values({
          id: input.id,
          organization_id: scope.organizationId,
          uploaded_by: input.uploadedBy,
          kind: input.kind,
          mime_type: input.mimeType,
          size_bytes: input.sizeBytes,
          duration_seconds: input.durationSeconds,
          width: input.width,
          height: input.height,
          filename: input.originalFilename,
          original_filename: input.originalFilename,
          s3_key: input.s3Key,
          status: "pending",
        })
        .returningAll()
        .executeTakeFirstOrThrow();

      await insertOccurrence(trx, inserted.id, input.place, input.uploadedBy);
      return inserted;
    });

    const { name } = await db
      .selectFrom("user")
      .select("name")
      .where("user.id", "=", row.uploaded_by)
      .executeTakeFirstOrThrow();

    return toFileRecord({ ...row, uploaded_by_name: name });
  };
