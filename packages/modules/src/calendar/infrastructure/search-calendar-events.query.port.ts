import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CalendarEvent } from "../domain/index.js";

export type SearchCalendarEventsQueryInput = { query: string };

export type SearchCalendarEventsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: SearchCalendarEventsQueryInput,
) => Promise<CalendarEvent[]>;

export type SearchCalendarEventsQueryPortFactory = () => SearchCalendarEventsQueryPort;
