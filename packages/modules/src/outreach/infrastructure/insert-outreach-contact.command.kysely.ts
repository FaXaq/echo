import type { InsertOutreachContactCommandPortFactory } from "./insert-outreach-contact.command.port.js";
import { toOutreachContact } from "./map-outreach.js";

export const insertOutreachContactCommandFactory: InsertOutreachContactCommandPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .insertInto("outreach_contact")
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

    return toOutreachContact(row);
  };
