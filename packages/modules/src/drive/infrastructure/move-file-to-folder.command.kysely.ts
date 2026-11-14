import type { DB } from "@echo/db";
import type { ExpressionBuilder } from "kysely";
import type { MoveFileToFolderCommandPortFactory } from "./move-file-to-folder.command.port.js";
import { makeSelectFileByIdQuery } from "./common.js";
import { toFileRecord } from "./map-file.js";

const inFolder = (folderId: string | null) => (eb: ExpressionBuilder<DB, "folder_file">) =>
  folderId === null ? eb("folder_id", "is", null) : eb("folder_id", "=", folderId);

export const moveFileToFolderCommandFactory: MoveFileToFolderCommandPortFactory =
  () => async (db, scope, input) => {
    const sourceFolderId = input.from.kind === "folder" ? input.from.id : null;

    const row = await db.transaction().execute(async (trx) => {
      const file = await trx
        .selectFrom("file")
        .select("file.id")
        .where("file.id", "=", input.id)
        .where("file.organization_id", "=", scope.organizationId)
        .executeTakeFirst();
      if (!file) return undefined;

      const placementIn = (folderId: string | null) =>
        trx
          .selectFrom("folder_file")
          .select("file_id")
          .where("file_id", "=", file.id)
          .where(inFolder(folderId));

      if (!(await placementIn(sourceFolderId).executeTakeFirst())) return undefined;

      if (sourceFolderId !== input.folderId) {
        if (await placementIn(input.folderId).executeTakeFirst()) {
          await trx
            .deleteFrom("folder_file")
            .where("file_id", "=", file.id)
            .where(inFolder(sourceFolderId))
            .execute();
        } else {
          await trx
            .updateTable("folder_file")
            .set({ folder_id: input.folderId })
            .where("file_id", "=", file.id)
            .where(inFolder(sourceFolderId))
            .execute();
        }
      }

      await trx
        .updateTable("file")
        .set({ updated_at: new Date() })
        .where("id", "=", file.id)
        .execute();

      return makeSelectFileByIdQuery(trx)(scope, file.id);
    });

    return row ? toFileRecord(row) : null;
  };
