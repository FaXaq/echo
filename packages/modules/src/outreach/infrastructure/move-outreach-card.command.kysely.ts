import type { MoveOutreachCardCommandPortFactory } from "./move-outreach-card.command.port.js";

export const moveOutreachCardCommandFactory: MoveOutreachCardCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .updateTable("outreach_card")
      .set({ column_id: input.columnId, position: input.position, updated_at: new Date() })
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numUpdatedRows > 0n;
  };
