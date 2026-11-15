import type { MoveFoldersCommandPortFactory } from "./move-folders.command.port.js";

export const moveFoldersCommandFactory: MoveFoldersCommandPortFactory =
  () => async (db, scope, input) => {
    await db
      .updateTable("folder")
      .set({ parent_folder_id: input.parentFolderId, updated_at: new Date() })
      .where("id", "in", input.ids)
      .where("organization_id", "=", scope.organizationId)
      .execute();
  };
