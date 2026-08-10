import type { KyselyDB } from "@echo/db";
import type { CalendarEvent } from "../domain/index.js";

export type ListCalendarEventsInput = {
  organizationId: string;
};

export type ListCalendarEventsQueryPort = (
  db: KyselyDB,
  input: ListCalendarEventsInput,
) => Promise<CalendarEvent[]>;

export type ListCalendarEventsQueryPortFactory = () => ListCalendarEventsQueryPort;
