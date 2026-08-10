import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { CalendarEvent } from "../domain/index.js";
import type { GetCalendarEventByIdQueryPort } from "../infrastructure/get-calendar-event-by-id.query.port.js";

export async function getEventById(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    getCalendarEventById: GetCalendarEventByIdQueryPort;
  },
  input: { eventId: string; organizationId: string | null },
): Promise<CalendarEvent> {
  const eventForPermissions = await deps.getCalendarEventById(deps.db, {
    eventId: input.eventId,
    organizationId: null,
  });

  if (
    input.organizationId &&
    eventForPermissions?.organization?.id &&
    input.organizationId !== eventForPermissions.organization.id
  ) {
    throw notFound("CalendarEvent");
  }

  if (eventForPermissions?.organization?.id) {
    const { success } = await deps.userHasPermissionInOrganization({
      organizationId: eventForPermissions.organization.id,
      permissions: { calendarEvent: ["read"] },
    });
    if (!success) throw forbidden({ entity: "CalendarEvent", action: "list" });
  }

  const calendarEvent = await deps.getCalendarEventById(deps.db, {
    eventId: input.eventId,
  });

  if (calendarEvent === undefined) throw notFound("CalendarEvent");

  return calendarEvent;
}
