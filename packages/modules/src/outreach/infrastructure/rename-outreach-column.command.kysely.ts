import type { RenameOutreachColumnCommandPortFactory } from "./rename-outreach-column.command.port.js";
import { toOutreachColumn } from "./map-outreach.js";

export const renameOutreachColumnCommandFactory: RenameOutreachColumnCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .updateTable("outreach_column")
      .set({ name: input.name, updated_at: new Date() })
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .returningAll()
      .executeTakeFirst();

    return row ? toOutreachColumn(row) : undefined;
  };
