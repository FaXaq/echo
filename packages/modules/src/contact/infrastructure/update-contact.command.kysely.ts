import type { UpdateContactCommandPortFactory } from "./update-contact.command.port.js";
import { toContact } from "./map-contact.js";

export const updateContactCommandFactory: UpdateContactCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .updateTable("contact")
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

    return row ? toContact(row) : undefined;
  };
