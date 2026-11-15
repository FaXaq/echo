import type { EventExistsInOrganizationQueryPortFactory } from "./event-exists-in-organization.query.port.js";

export const eventExistsInOrganizationQueryFactory: EventExistsInOrganizationQueryPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .selectFrom("calendar_event")
      .select("calendar_event.id")
      .where("calendar_event.id", "=", input.eventId)
      .where("calendar_event.organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return row !== undefined;
  };
