import type { DeleteFolderCascadeCommandPortFactory } from "./delete-folder-cascade.command.port.js";
import { selectFolderAndDescendantIds } from "./common.js";

export const deleteFolderCascadeCommandFactory: DeleteFolderCascadeCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const folderIds = await selectFolderAndDescendantIds(trx, scope, input.id);
      if (folderIds.length === 0) return null;

      const files = await trx
        .selectFrom("file")
        .select(["id", "s3_key", "event_id"])
        .where("folder_id", "in", folderIds)
        .execute();

      const spared = files.filter((file) => file.event_id !== null);
      const toDelete = files.filter((file) => file.event_id === null);

      if (spared.length > 0) {
        await trx
          .updateTable("file")
          .set({ folder_id: null, updated_at: new Date() })
          .where(
            "id",
            "in",
            spared.map((file) => file.id),
          )
          .execute();
      }

      if (toDelete.length > 0) {
        await trx
          .deleteFrom("file")
          .where(
            "id",
            "in",
            toDelete.map((file) => file.id),
          )
          .execute();
      }

      await trx
        .deleteFrom("folder")
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .execute();

      return {
        deletedFiles: toDelete.map((file) => ({ id: file.id, s3Key: file.s3_key })),
      };
    });
  };
