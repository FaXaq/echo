import type { KyselyDB } from "@echo/db";
import type { CalendarEvent, EventColor, EventPlace, EventType } from "../domain/index.js";

export type InsertCalendarEventInput = {
  id: string;
  organizationId: string;
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

export type InsertCalendarEventCommandPort = (
  db: KyselyDB,
  input: InsertCalendarEventInput,
) => Promise<CalendarEvent>;

export type InsertCalendarEventCommandPortFactory = () => InsertCalendarEventCommandPort;
