import type { ListOutreachCardContactsQueryPortFactory } from "./list-outreach-card-contacts.query.port.js";

export const listOutreachCardContactsQueryFactory: ListOutreachCardContactsQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("outreach_card_contact")
      .innerJoin("contact", "contact.id", "outreach_card_contact.contact_id")
      .select([
        "contact.id",
        "contact.name",
        "contact.phone",
        "contact.email",
        "contact.description",
      ])
      .where("outreach_card_contact.card_id", "=", input.cardId)
      .where("contact.organization_id", "=", scope.organizationId)
      .orderBy("contact.name", "asc")
      .execute();

    return rows;
  };
