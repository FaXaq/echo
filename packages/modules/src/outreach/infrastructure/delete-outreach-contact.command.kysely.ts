import type { DeleteOutreachContactCommandPortFactory } from "./delete-outreach-contact.command.port.js";

export const deleteOutreachContactCommandFactory: DeleteOutreachContactCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .deleteFrom("outreach_contact")
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
