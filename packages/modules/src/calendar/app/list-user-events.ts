import type { KyselyDB } from "@echo/db";
import type { CalendarEvent } from "../domain/index.js";
import { listUserCalendarEvents } from "../infrastructure/index.js";

export function listUserEvents(
  deps: { db: KyselyDB },
  input: { userId: string },
): Promise<CalendarEvent[]> {
  return listUserCalendarEvents(deps.db, input);
}
