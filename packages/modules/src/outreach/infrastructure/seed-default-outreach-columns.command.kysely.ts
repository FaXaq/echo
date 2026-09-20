import { DEFAULT_OUTREACH_COLUMN_NAMES } from "../domain/index.js";
import type { SeedDefaultOutreachColumnsCommandPortFactory } from "./seed-default-outreach-columns.command.port.js";
import { toOutreachColumn } from "./map-outreach.js";

export const seedDefaultOutreachColumnsCommandFactory: SeedDefaultOutreachColumnsCommandPortFactory =
  () => async (db, scope) => {
    const rows = await db
      .insertInto("outreach_column")
      .values(
        DEFAULT_OUTREACH_COLUMN_NAMES.map((name, position) => ({
          id: crypto.randomUUID(),
          organization_id: scope.organizationId,
          name,
          position,
        })),
      )
      .returningAll()
      .execute();

    return rows.map(toOutreachColumn);
  };
