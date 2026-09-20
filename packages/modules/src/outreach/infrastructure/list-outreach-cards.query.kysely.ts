import type { ListOutreachCardsQueryPortFactory } from "./list-outreach-cards.query.port.js";
import { toOutreachCard } from "./map-outreach.js";

export const listOutreachCardsQueryFactory: ListOutreachCardsQueryPortFactory =
  () => async (db, scope) => {
    const rows = await db
      .selectFrom("outreach_card")
      .leftJoin("user", "user.id", "outreach_card.assignee_id")
      .selectAll("outreach_card")
      .select("user.name as assignee_name")
      .where("outreach_card.organization_id", "=", scope.organizationId)
      .orderBy("outreach_card.position", "asc")
      .execute();

    return rows.map(toOutreachCard);
  };
