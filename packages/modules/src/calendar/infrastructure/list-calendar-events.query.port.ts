import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CalendarEvent } from "../domain/index.js";

export type ListCalendarEventsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<CalendarEvent[]>;

export type ListCalendarEventsQueryPortFactory = () => ListCalendarEventsQueryPort;
