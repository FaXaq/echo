import type { RenameFolderByIdCommandPortFactory } from "./rename-folder-by-id.command.port.js";
import { makeSelectFolderByIdQuery } from "./common.js";
import { toFolderRecord } from "./map-folder.js";

export const renameFolderByIdCommandFactory: RenameFolderByIdCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable("folder")
        .set({ name: input.name, updated_at: new Date() })
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("folder.id")
        .executeTakeFirst();

      if (!updated) return undefined;

      const selectFolderById = makeSelectFolderByIdQuery(trx);

      return await selectFolderById(scope, updated.id);
    });

    return row ? toFolderRecord(row) : null;
  };
