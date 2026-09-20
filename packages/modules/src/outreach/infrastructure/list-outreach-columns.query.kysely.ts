import type { ListOutreachColumnsQueryPortFactory } from "./list-outreach-columns.query.port.js";
import { toOutreachColumn } from "./map-outreach.js";

export const listOutreachColumnsQueryFactory: ListOutreachColumnsQueryPortFactory =
  () => async (db, scope) => {
    const rows = await db
      .selectFrom("outreach_column")
      .selectAll()
      .where("organization_id", "=", scope.organizationId)
      .orderBy("position", "asc")
      .execute();

    return rows.map(toOutreachColumn);
  };
