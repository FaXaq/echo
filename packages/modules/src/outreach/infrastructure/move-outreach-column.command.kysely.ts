import type { MoveOutreachColumnCommandPortFactory } from "./move-outreach-column.command.port.js";

export const moveOutreachColumnCommandFactory: MoveOutreachColumnCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .updateTable("outreach_column")
      .set({ position: input.position, updated_at: new Date() })
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numUpdatedRows > 0n;
  };
