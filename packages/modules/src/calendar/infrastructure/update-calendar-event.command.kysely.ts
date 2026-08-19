import type { UpdateCalendarEventCommandPortFactory } from "./update-calendar-event.command.port.js";
import { makeSelectCalendarEventByIdQuery } from "./common.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export const updateCalendarEventCommandFactory: UpdateCalendarEventCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const updated = await trx
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
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("id")
        .executeTakeFirst();
      if (!updated) return null;

      const row = await makeSelectCalendarEventByIdQuery(trx)(scope, updated.id);

      return toCalendarEvent(row);
    });
  };
