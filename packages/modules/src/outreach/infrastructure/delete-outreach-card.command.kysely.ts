import type { DeleteOutreachCardCommandPortFactory } from "./delete-outreach-card.command.port.js";

export const deleteOutreachCardCommandFactory: DeleteOutreachCardCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .deleteFrom("outreach_card")
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
