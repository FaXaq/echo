import type { InsertCalendarEventCommandPortFactory } from "./insert-calendar-event.command.port.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export const insertCalendarEventCommandFactory: InsertCalendarEventCommandPortFactory =
  () => async (db, input) => {
    const row = await db
      .insertInto("calendar_event")
      .values({
        id: input.id,
        title: input.title,
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        all_day: input.allDay,
        color: input.color,
        type: input.type,
        organization_id: input.organizationId,
        created_by: input.userId,
        updated_by: input.userId,
        place_name: input.place?.name ?? null,
        place_address: input.place?.address ?? null,
        place_lat: input.place?.lat ?? null,
        place_lng: input.place?.lng ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();

    return toCalendarEvent(row);
  };
