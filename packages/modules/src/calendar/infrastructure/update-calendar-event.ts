import type { KyselyDB } from "@echo/db";
import type { CalendarEvent, EventColor } from "../domain/index.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export async function updateCalendarEvent(
  db: KyselyDB,
  input: {
    id: string;
    organizationId: string | null;
    userId: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    allDay: boolean;
    color: EventColor;
  },
): Promise<CalendarEvent | null> {
  let query = db
    .updateTable("calendar_event")
    .set({
      title: input.title,
      description: input.description,
      start_date: input.startDate,
      end_date: input.endDate,
      all_day: input.allDay,
      color: input.color,
      updated_by: input.userId,
      updated_at: new Date(),
    })
    .where("id", "=", input.id);

  if (input.organizationId === null) {
    query = query
      .where("organization_id", "is", null)
      .where("created_by", "=", input.userId)
  } else {
    query = query.where("organization_id", "=", input.organizationId)
  }

  const row = await query
    .returningAll()
    .executeTakeFirst();

  return row ? toCalendarEvent(row) : null;
}
