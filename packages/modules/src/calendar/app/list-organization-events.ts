import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { UserPermissionRepoPort } from "@echo/modules/user/infrastructure";
import type { CalendarEvent } from "../domain/index.js";
import { listOrganizationCalendarEvents } from "../infrastructure/index.js";

export async function listOrganizationEvents(
  deps: { db: KyselyDB; userPermission: UserPermissionRepoPort },
  input: { organizationId: string; userId: string },
): Promise<CalendarEvent[]> {
  const { success } = await deps.userPermission.userHasPermissionInOrganization({
    organizationId: input.organizationId,
    permissions: { calendarEvent: ["read"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "list" });

  return listOrganizationCalendarEvents(deps.db, { organizationId: input.organizationId });
}
