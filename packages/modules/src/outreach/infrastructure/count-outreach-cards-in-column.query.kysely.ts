import { sql } from "kysely";
import type { CountOutreachCardsInColumnQueryPortFactory } from "./count-outreach-cards-in-column.query.port.js";

export const countOutreachCardsInColumnQueryFactory: CountOutreachCardsInColumnQueryPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .selectFrom("outreach_card")
      .select(sql<number>`count(*)`.as("count"))
      .where("column_id", "=", input.columnId)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirstOrThrow();

    return Number(row.count);
  };
