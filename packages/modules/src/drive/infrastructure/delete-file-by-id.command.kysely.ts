import type { DeleteFileByIdCommandPortFactory } from "./delete-file-by-id.command.port.js";

export const deleteFileByIdCommandFactory: DeleteFileByIdCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .deleteFrom("file")
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();
    return result.numDeletedRows > 0n;
  };
