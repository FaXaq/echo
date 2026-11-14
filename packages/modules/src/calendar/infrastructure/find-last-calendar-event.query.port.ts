import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CalendarEvent } from "../domain/index.js";

export type FindLastCalendarEventQueryInput = { now: Date };

export type FindLastCalendarEventQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindLastCalendarEventQueryInput,
) => Promise<CalendarEvent | null>;

export type FindLastCalendarEventQueryPortFactory = () => FindLastCalendarEventQueryPort;
