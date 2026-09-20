import type { ListOutreachContactsQueryPortFactory } from "./list-outreach-contacts.query.port.js";
import { toOutreachContact } from "./map-outreach.js";

export const listOutreachContactsQueryFactory: ListOutreachContactsQueryPortFactory =
  () => async (db, scope) => {
    const rows = await db
      .selectFrom("outreach_contact")
      .selectAll()
      .where("organization_id", "=", scope.organizationId)
      .orderBy("name", "asc")
      .execute();

    return rows.map(toOutreachContact);
  };
