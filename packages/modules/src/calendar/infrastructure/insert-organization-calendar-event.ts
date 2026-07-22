import type { KyselyDB } from "@echo/db";
import type { CalendarEvent, EventColor } from "../domain/index.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export async function insertOrganizationCalendarEvent(
  db: KyselyDB,
  input: {
    id: string;
    organizationId: string;
    userId: string;
    title: string;
    description: string | null;
    startDate: Date;
    endDate: Date;
    allDay: boolean;
    color: EventColor;
  },
): Promise<CalendarEvent> {
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
      organization_id: input.organizationId,
      created_by: input.userId,
      updated_by: input.userId,
    })
    .returningAll()
    .executeTakeFirstOrThrow();

  return toCalendarEvent(row);
}
