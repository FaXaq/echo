import type { KyselyDB } from "@echo/db";
import type { CalendarEvent } from "../domain/index.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export async function listOrganizationCalendarEvents(
  db: KyselyDB,
  input: { organizationId: string },
): Promise<CalendarEvent[]> {
  const rows = await db
    .selectFrom("calendar_event")
    .selectAll()
    .where("organization_id", "=", input.organizationId)
    .execute();

  return rows.map(toCalendarEvent);
}
