import type { KyselyDB } from "@echo/db";
import type { CalendarEvent } from "../domain/index.js";
import { toCalendarEvent } from "./map-calendar-event.js";

export async function listUserCalendarEvents(
  db: KyselyDB,
  input: { userId: string },
): Promise<CalendarEvent[]> {
  const organizations = await db
    .selectFrom("member")
    .select("organizationId")
    .where("userId", "=", input.userId)
    .execute()

  const organizationIds = organizations.map(o => o.organizationId);

  const rows = await db
    .selectFrom("calendar_event")
    .selectAll()
    .where(wb => wb.or([
      wb.and([
      wb("created_by", "=", input.userId),
      wb("organization_id", "is", null)
      ]),
      wb("organization_id", "in", organizationIds)
    ]))
    .execute();

  return rows.map(toCalendarEvent);
}
