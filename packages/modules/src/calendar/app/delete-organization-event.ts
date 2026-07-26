import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import { deleteOrganizationCalendarEvent } from "../infrastructure/index.js";

export async function deleteOrganizationEvent(
  deps: { db: KyselyDB; userHasPermissionInOrganization: CheckOrganizationPermission },
  input: { id: string; organizationId: string; userId: string },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.organizationId,
    permissions: { calendarEvent: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "delete" });

  const deleted = await deleteOrganizationCalendarEvent(deps.db, {
    id: input.id,
    organizationId: input.organizationId,
  });
  if (!deleted) throw notFound("CalendarEvent");
}
