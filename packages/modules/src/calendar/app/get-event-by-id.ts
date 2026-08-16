import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CalendarEvent } from "../domain/index.js";
import type { GetCalendarEventByIdQueryPort } from "../infrastructure/get-calendar-event-by-id.query.port.js";

export async function getEventById(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    getCalendarEventById: GetCalendarEventByIdQueryPort;
  },
  input: { eventId: string; scope: OrganizationScope },
): Promise<CalendarEvent> {
  const calendarEvent = await deps.getCalendarEventById(deps.db, input.scope, {
    eventId: input.eventId,
  });

  if (calendarEvent === undefined) throw notFound("CalendarEvent");

  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { calendarEvent: ["read"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "list" });

  return calendarEvent;
}
