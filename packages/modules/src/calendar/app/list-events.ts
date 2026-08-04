import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { CalendarEvent } from "../domain/index.js";
import { listCalendarEvents } from "../infrastructure/index.js";

export async function listEvents(
  deps: { db: KyselyDB; userHasPermissionInOrganization: CheckOrganizationPermission },
  input: { userId: string; organizationId?: string | null },
): Promise<CalendarEvent[]> {
  if (input.organizationId) {
    const { success } = await deps.userHasPermissionInOrganization({
      organizationId: input.organizationId,
      permissions: { calendarEvent: ["read"] },
    });
    if (!success) throw forbidden({ entity: "CalendarEvent", action: "list" });
  }

  return listCalendarEvents(deps.db, {
    userId: input.userId,
    organizationId: input.organizationId,
  });
}
