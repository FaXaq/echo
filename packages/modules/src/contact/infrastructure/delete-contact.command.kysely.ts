import type { DeleteContactCommandPortFactory } from "./delete-contact.command.port.js";

export const deleteContactCommandFactory: DeleteContactCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .deleteFrom("contact")
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
