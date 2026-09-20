import type { InsertOutreachColumnCommandPortFactory } from "./insert-outreach-column.command.port.js";
import { toOutreachColumn } from "./map-outreach.js";

export const insertOutreachColumnCommandFactory: InsertOutreachColumnCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .insertInto("outreach_column")
      .values({
        id: input.id,
        organization_id: scope.organizationId,
        name: input.name,
        position: input.position,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toOutreachColumn(row);
  };
