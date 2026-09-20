import type { ListOutreachCardContactsQueryPortFactory } from "./list-outreach-card-contacts.query.port.js";
import { toOutreachContact } from "./map-outreach.js";

export const listOutreachCardContactsQueryFactory: ListOutreachCardContactsQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("outreach_card_contact")
      .innerJoin("outreach_contact", "outreach_contact.id", "outreach_card_contact.contact_id")
      .selectAll("outreach_contact")
      .where("outreach_card_contact.card_id", "=", input.cardId)
      .where("outreach_contact.organization_id", "=", scope.organizationId)
      .orderBy("outreach_contact.name", "asc")
      .execute();

    return rows.map(toOutreachContact);
  };
