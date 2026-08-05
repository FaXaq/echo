import type { KyselyDB } from "@echo/db";
import type { CalendarEvent, EventColor, EventPlace, EventType } from "../domain/index.js";

export type UpdateCalendarEventInput = {
  id: string;
  organizationId: string | null;
  userId: string;
  title: string;
  description: string | null;
  startDate: Date;
  endDate: Date;
  allDay: boolean;
  color: EventColor;
  type: EventType | null;
  place: EventPlace | null;
};

export type UpdateCalendarEventCommandPort = (
  db: KyselyDB,
  input: UpdateCalendarEventInput,
) => Promise<CalendarEvent | null>;

export type UpdateCalendarEventCommandPortFactory = () => UpdateCalendarEventCommandPort;
