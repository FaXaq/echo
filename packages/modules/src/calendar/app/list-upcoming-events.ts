import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { ListUpcomingCalendarEventsQueryPort } from "../infrastructure/list-upcoming-calendar-events.query.port.js";

export async function listUpcomingEvents(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listUpcomingCalendarEventsQuery: ListUpcomingCalendarEventsQueryPort;
  },
  input: { scope: OrganizationScope; now: Date; limit: number },
) {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { calendarEvent: ["read"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "list" });

  return deps.listUpcomingCalendarEventsQuery(deps.db, input.scope, {
    now: input.now,
    limit: input.limit,
  });
}
