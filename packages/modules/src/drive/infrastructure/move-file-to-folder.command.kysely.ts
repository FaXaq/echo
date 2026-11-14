import type { MoveFileToFolderCommandPortFactory } from "./move-file-to-folder.command.port.js";
import { makeSelectFileByIdQuery } from "./common.js";
import { toFileRecord } from "./map-file.js";

export const moveFileToFolderCommandFactory: MoveFileToFolderCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable("file")
        .set({ updated_at: new Date() })
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("file.id")
        .executeTakeFirst();

      if (!updated) return undefined;

      await trx.deleteFrom("folder_file").where("file_id", "=", updated.id).execute();
      await trx
        .insertInto("folder_file")
        .values({ file_id: updated.id, folder_id: input.folderId, placed_by: input.placedBy })
        .execute();

      const selectFileById = makeSelectFileByIdQuery(trx);

      return await selectFileById(scope, updated.id);
    });

    return row ? toFileRecord(row) : null;
  };
