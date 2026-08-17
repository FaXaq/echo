import type { InsertFolderCommandPortFactory } from "./insert-folder.command.port.js";
import { toFolderRecord } from "./map-folder.js";

export const insertFolderCommandFactory: InsertFolderCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .insertInto("folder")
      .values({
        id: input.id,
        organization_id: scope.organizationId,
        parent_folder_id: input.parentFolderId,
        name: input.name,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toFolderRecord(row);
  };
