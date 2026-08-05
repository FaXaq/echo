import type { UpdateCalendarEventCommandPortFactory } from "./update-calendar-event.command.port.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export const updateCalendarEventCommandFactory: UpdateCalendarEventCommandPortFactory =
  () => async (db, input) => {
    let query = db
      .updateTable("calendar_event")
      .set({
        title: input.title,
        description: input.description,
        start_date: input.startDate,
        end_date: input.endDate,
        all_day: input.allDay,
        color: input.color,
        type: input.type,
        updated_by: input.userId,
        updated_at: new Date(),
        place_name: input.place?.name ?? null,
        place_address: input.place?.address ?? null,
        place_lat: input.place?.lat ?? null,
        place_lng: input.place?.lng ?? null,
      })
      .where("id", "=", input.id);

    if (input.organizationId === null) {
      query = query
        .where("organization_id", "is", null)
        .where("created_by", "=", input.userId);
    } else {
      query = query.where("organization_id", "=", input.organizationId);
    }

    const row = await query.returningAll().executeTakeFirst();

    return row ? toCalendarEvent(row) : null;
  };
