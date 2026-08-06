import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { CalendarEvent } from "../domain/index.js";
import type { GetCalendarEventByIdQueryPort } from "../infrastructure/get-calendar-event-by-id.query.port.js";

export async function getEventById(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    getCalendarEventById: GetCalendarEventByIdQueryPort;
  },
  input: { eventId: string, organizationId: string | null },
): Promise<CalendarEvent> {
  const eventForPermissions = await deps.getCalendarEventById(deps.db, {
    eventId: input.eventId,
    organizationId: null
  });

  if (input.organizationId
    && eventForPermissions?.organizationId
    && input.organizationId !== eventForPermissions?.organizationId) {
    throw notFound("CalendarEvent")
  }

  if (eventForPermissions && eventForPermissions.organizationId) {
    const { success } = await deps.userHasPermissionInOrganization({
      organizationId: eventForPermissions.organizationId,
      permissions: { calendarEvent: ["read"] },
    });
    if (!success) throw forbidden({ entity: "CalendarEvent", action: "list" });
  }

  const calendarEvent = await deps.getCalendarEventById(deps.db, {
    eventId: input.eventId,
  });

  if (calendarEvent === undefined) throw notFound("CalendarEvent")

  return calendarEvent;
}
