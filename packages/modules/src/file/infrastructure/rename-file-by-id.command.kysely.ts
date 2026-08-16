import type { RenameFileByIdCommandPortFactory } from "./rename-file-by-id.command.port.js";
import { makeSelectFileByIdQuery } from "./common.js";
import { toFileRecord } from "./map-file.js";

export const renameFileByIdCommandFactory: RenameFileByIdCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable("file")
        .set({ filename: input.filename, updated_at: new Date() })
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("file.id")
        .executeTakeFirst();

      if (!updated) return undefined;

      const selectFileById = makeSelectFileByIdQuery(trx);

      return await selectFileById(scope, updated.id);
    });

    return row ? toFileRecord(row) : null;
  };
