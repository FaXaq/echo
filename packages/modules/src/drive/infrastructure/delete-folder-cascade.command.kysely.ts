import type { DeleteFolderCascadeCommandPortFactory } from "./delete-folder-cascade.command.port.js";
import { selectFolderAndDescendantIds } from "./common.js";

export const deleteFolderCascadeCommandFactory: DeleteFolderCascadeCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const folderIds = await selectFolderAndDescendantIds(trx, scope, input.id);
      if (folderIds.length === 0) return null;

      const placements = await trx
        .deleteFrom("folder_file")
        .where("folder_id", "in", folderIds)
        .returning("file_id")
        .execute();

      await trx
        .deleteFrom("folder")
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .execute();

      return { fileIds: [...new Set(placements.map((placement) => placement.file_id))] };
    });
  };
