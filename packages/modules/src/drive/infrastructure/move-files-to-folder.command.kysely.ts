import type { DB } from "@echo/db";
import type { ExpressionBuilder } from "kysely";
import type { MoveFilesToFolderCommandPortFactory } from "./move-files-to-folder.command.port.js";

const inFolder = (folderId: string | null) => (eb: ExpressionBuilder<DB, "folder_file">) =>
  folderId === null ? eb("folder_id", "is", null) : eb("folder_id", "=", folderId);

export const moveFilesToFolderCommandFactory: MoveFilesToFolderCommandPortFactory =
  () => async (db, scope, input) => {
    const sourceFolderId = input.from.kind === "folder" ? input.from.id : null;

    return db.transaction().execute(async (trx) => {
      const placed = await trx
        .selectFrom("folder_file")
        .select("file_id")
        .where(
          "file_id",
          "in",
          trx
            .selectFrom("file")
            .select("id")
            .where("id", "in", input.ids)
            .where("organization_id", "=", scope.organizationId),
        )
        .where(inFolder(sourceFolderId))
        .execute();
      if (placed.length !== input.ids.length) return false;
      if (sourceFolderId === input.folderId) return true;

      const alreadyThere = await trx
        .selectFrom("folder_file")
        .select("file_id")
        .where("file_id", "in", input.ids)
        .where(inFolder(input.folderId))
        .execute();
      const alreadyThereIds = alreadyThere.map((row) => row.file_id);
      const toMove = input.ids.filter((id) => !alreadyThereIds.includes(id));

      if (alreadyThereIds.length > 0) {
        await trx
          .deleteFrom("folder_file")
          .where("file_id", "in", alreadyThereIds)
          .where(inFolder(sourceFolderId))
          .execute();
      }
      if (toMove.length > 0) {
        await trx
          .updateTable("folder_file")
          .set({ folder_id: input.folderId })
          .where("file_id", "in", toMove)
          .where(inFolder(sourceFolderId))
          .execute();
      }
      await trx
        .updateTable("file")
        .set({ updated_at: new Date() })
        .where("id", "in", input.ids)
        .execute();
      return true;
    });
  };
