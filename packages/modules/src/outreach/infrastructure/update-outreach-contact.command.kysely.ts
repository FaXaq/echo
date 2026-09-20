import type { UpdateOutreachContactCommandPortFactory } from "./update-outreach-contact.command.port.js";
import { toOutreachContact } from "./map-outreach.js";

export const updateOutreachContactCommandFactory: UpdateOutreachContactCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .updateTable("outreach_contact")
      .set({
        name: input.name,
        phone: input.phone,
        email: input.email,
        description: input.description,
        updated_at: new Date(),
      })
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .returningAll()
      .executeTakeFirst();

    return row ? toOutreachContact(row) : undefined;
  };
