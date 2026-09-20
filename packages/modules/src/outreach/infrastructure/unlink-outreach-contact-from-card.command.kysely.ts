import type { UnlinkOutreachContactFromCardCommandPortFactory } from "./unlink-outreach-contact-from-card.command.port.js";

export const unlinkOutreachContactFromCardCommandFactory: UnlinkOutreachContactFromCardCommandPortFactory =
  () => async (db, scope, input) => {
    await db
      .deleteFrom("outreach_card_contact")
      .where("card_id", "=", input.cardId)
      .where("contact_id", "=", input.contactId)
      .where(
        "card_id",
        "in",
        db
          .selectFrom("outreach_card")
          .select("id")
          .where("organization_id", "=", scope.organizationId),
      )
      .execute();
  };
