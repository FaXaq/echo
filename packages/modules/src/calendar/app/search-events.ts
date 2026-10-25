import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CalendarEvent } from "../domain/index.js";
import type { SearchCalendarEventsQueryPort } from "../infrastructure/search-calendar-events.query.port.js";

export async function searchEvents(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    searchCalendarEventsQuery: SearchCalendarEventsQueryPort;
  },
  input: { scope: OrganizationScope; query: string },
): Promise<CalendarEvent[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { calendarEvent: ["read"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "list" });

  return deps.searchCalendarEventsQuery(deps.db, input.scope, { query: input.query });
}
