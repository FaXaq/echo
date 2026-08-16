import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CalendarEvent } from "../domain/index.js";

export type GetCalendarEventByIdQueryInput = {
  eventId: string;
};

export type GetCalendarEventByIdQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: GetCalendarEventByIdQueryInput,
) => Promise<CalendarEvent | undefined>;

export type GetCalendarEventByIdQueryPortFactory = () => GetCalendarEventByIdQueryPort;
