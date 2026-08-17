import type { MarkFileUploadedCommandPortFactory } from "./mark-file-uploaded.command.port.js";
import { makeSelectFileByIdQuery } from "./common.js";
import { toFileRecord } from "./map-file.js";

export const markFileUploadedCommandFactory: MarkFileUploadedCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable("file")
        .set({
          status: "uploaded",
          updated_at: new Date(),
          ...(input.sizeBytes === null ? {} : { size_bytes: input.sizeBytes }),
        })
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("id")
        .executeTakeFirst();

      if (!updated) return undefined;

      const selectFileById = makeSelectFileByIdQuery(trx);

      return await selectFileById(scope, updated.id);
    });

    return row ? toFileRecord(row) : null;
  };
