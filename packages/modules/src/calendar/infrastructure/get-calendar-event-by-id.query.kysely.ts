import type { GetCalendarEventByIdQueryPortFactory } from "./get-calendar-event-by-id.query.port.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export const getCalendarEventByIdFactory: GetCalendarEventByIdQueryPortFactory =
  () => async (db, input) => {
    const row = await db
      .selectFrom("calendar_event")
      .innerJoin("user", "user.id", "created_by")
      .selectAll("calendar_event")
      .select("user.name as created_by_name")
      .innerJoin("organization", "calendar_event.organization_id", "organization.id")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("calendar_event.id", "=", input.eventId)
      .executeTakeFirst();

    return row ? toCalendarEvent(row) : undefined;
  };
