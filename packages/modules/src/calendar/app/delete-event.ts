import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { DeleteCalendarEventCommandPort } from "../infrastructure/delete-calendar-event.command.port.js";

export async function deleteEvent(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteCalendarEventCommand: DeleteCalendarEventCommandPort;
  },
  input: { id: string; organizationId: string },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.organizationId,
    permissions: { calendarEvent: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "delete" });

  const deleted = await deps.deleteCalendarEventCommand(deps.db, input);
  if (!deleted) throw notFound("CalendarEvent");
}
