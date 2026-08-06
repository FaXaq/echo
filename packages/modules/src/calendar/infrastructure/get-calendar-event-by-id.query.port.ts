import type { KyselyDB } from "@echo/db";
import type { CalendarEvent } from "../domain/index.js";

export type GetCalendarEventByIdQueryInput = {
  eventId: string
  organizationId?: string | null
};

export type GetCalendarEventByIdQueryPort = (
  db: KyselyDB,
  input: GetCalendarEventByIdQueryInput,
) => Promise<CalendarEvent|undefined>;

export type GetCalendarEventByIdQueryPortFactory = () => GetCalendarEventByIdQueryPort;
