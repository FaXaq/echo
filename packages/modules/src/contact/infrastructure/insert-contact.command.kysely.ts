import type { InsertContactCommandPortFactory } from "./insert-contact.command.port.js";
import { toContact } from "./map-contact.js";

export const insertContactCommandFactory: InsertContactCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .insertInto("contact")
      .values({
        id: input.id,
        organization_id: scope.organizationId,
        name: input.name,
        phone: input.phone,
        email: input.email,
        description: input.description,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toContact(row);
  };
