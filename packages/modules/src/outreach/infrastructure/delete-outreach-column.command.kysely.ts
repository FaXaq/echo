import type { DeleteOutreachColumnCommandPortFactory } from "./delete-outreach-column.command.port.js";

export const deleteOutreachColumnCommandFactory: DeleteOutreachColumnCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .deleteFrom("outreach_column")
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
