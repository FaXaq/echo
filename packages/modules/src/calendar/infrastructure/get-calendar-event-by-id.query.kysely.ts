import type { GetCalendarEventByIdQueryPortFactory } from "./get-calendar-event-by-id.query.port.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export const getCalendarEventByIdFactory: GetCalendarEventByIdQueryPortFactory =
  () => async (db, input) => {
    let query = db
      .selectFrom("calendar_event")
      .innerJoin("user", "user.id", "created_by")
      .selectAll("calendar_event")
      .select("user.name as created_by_name")
      .where("calendar_event.id", "=", input.eventId);

    if (input.organizationId === null) {
      query = query.where("calendar_event.organization_id", "is", null);
    } else if (input.organizationId !== undefined) {
      query = query.where("calendar_event.organization_id", "=", input.organizationId);
    }

    const row = await query.executeTakeFirst();

    return row ? toCalendarEvent(row) : undefined;
  };
