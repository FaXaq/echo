import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CalendarEvent } from "../domain/index.js";
import type { ListCalendarEventsQueryPort } from "../infrastructure/list-calendar-events.query.port.js";

export async function listEvents(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listCalendarEventsQuery: ListCalendarEventsQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<CalendarEvent[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { calendarEvent: ["read"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "list" });

  return deps.listCalendarEventsQuery(deps.db, input.scope);
}
