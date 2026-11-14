import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FindLastCalendarEventQueryPort } from "../infrastructure/find-last-calendar-event.query.port.js";

export async function getLastEvent(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findLastCalendarEventQuery: FindLastCalendarEventQueryPort;
  },
  input: { scope: OrganizationScope; now: Date },
) {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { calendarEvent: ["read"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "read" });

  return deps.findLastCalendarEventQuery(deps.db, input.scope, { now: input.now });
}
