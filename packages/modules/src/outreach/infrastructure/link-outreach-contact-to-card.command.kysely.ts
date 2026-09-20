import type { LinkOutreachContactToCardCommandPortFactory } from "./link-outreach-contact-to-card.command.port.js";

export const linkOutreachContactToCardCommandFactory: LinkOutreachContactToCardCommandPortFactory =
  () => async (db, scope, input) => {
    await db
      .insertInto("outreach_card_contact")
      .columns(["card_id", "contact_id"])
      .expression(
        db
          .selectNoFrom((eb) => [
            eb.val(input.cardId).as("card_id"),
            eb.val(input.contactId).as("contact_id"),
          ])
          .where((eb) =>
            eb.exists(
              db
                .selectFrom("outreach_card")
                .select("id")
                .where("id", "=", input.cardId)
                .where("organization_id", "=", scope.organizationId),
            ),
          )
          .where((eb) =>
            eb.exists(
              db
                .selectFrom("outreach_contact")
                .select("id")
                .where("id", "=", input.contactId)
                .where("organization_id", "=", scope.organizationId),
            ),
          ),
      )
      .onConflict((oc) => oc.columns(["card_id", "contact_id"]).doNothing())
      .execute();
  };
