import type { ListCalendarEventsQueryPortFactory } from "./list-calendar-events.query.port.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export const listCalendarEventsQueryFactory: ListCalendarEventsQueryPortFactory =
  () => async (db, input) => {
    const rows = await db
      .selectFrom("calendar_event")
      .innerJoin("user", "user.id", "created_by")
      .selectAll("calendar_event")
      .select("user.name as created_by_name")
      .innerJoin("organization", "organization.id", "calendar_event.organization_id")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("organization_id", "=", input.organizationId)
      .execute();

    return rows.map(toCalendarEvent);
  };
