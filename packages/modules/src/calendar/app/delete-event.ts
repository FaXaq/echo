import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import { deleteCalendarEvent } from "../infrastructure/index.js";

export async function deleteEvent(
  deps: { db: KyselyDB; userHasPermissionInOrganization: CheckOrganizationPermission },
  input: { id: string; organizationId: string | null; userId: string },
): Promise<void> {
  if (input.organizationId !== null) {
    const { success } = await deps.userHasPermissionInOrganization({
      organizationId: input.organizationId,
      permissions: { calendarEvent: ["delete"] },
    });
    if (!success) throw forbidden({ entity: "CalendarEvent", action: "delete" });
  }

  const deleted = await deleteCalendarEvent(deps.db, input);
  if (!deleted) throw notFound("CalendarEvent");
}
