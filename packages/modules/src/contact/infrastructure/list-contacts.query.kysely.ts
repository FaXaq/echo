import type { ListContactsQueryPortFactory } from "./list-contacts.query.port.js";
import { toContact } from "./map-contact.js";

export const listContactsQueryFactory: ListContactsQueryPortFactory = () => async (db, scope) => {
  const rows = await db
    .selectFrom("contact")
    .selectAll()
    .where("organization_id", "=", scope.organizationId)
    .orderBy("name", "asc")
    .execute();

  return rows.map(toContact);
};
