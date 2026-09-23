import type { GetOutreachCardByIdQueryPortFactory } from "./get-outreach-card-by-id.query.port.js";
import { toOutreachCard } from "./map-outreach.js";

export const getOutreachCardByIdQueryFactory: GetOutreachCardByIdQueryPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .selectFrom("outreach_card")
      .leftJoin("user", "user.id", "outreach_card.assignee_id")
      .selectAll("outreach_card")
      .select("user.name as assignee_name")
      .where("outreach_card.id", "=", input.cardId)
      .where("outreach_card.organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return row ? toOutreachCard(row) : undefined;
  };
