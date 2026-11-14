import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CalendarEvent } from "../domain/index.js";

export type ListUpcomingCalendarEventsQueryInput = { now: Date; limit: number };

export type ListUpcomingCalendarEventsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListUpcomingCalendarEventsQueryInput,
) => Promise<CalendarEvent[]>;

export type ListUpcomingCalendarEventsQueryPortFactory = () => ListUpcomingCalendarEventsQueryPort;
