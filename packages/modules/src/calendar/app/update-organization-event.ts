import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import { isValidEventRange, type CalendarEvent, type EventColor } from "../domain/index.js";
import { updateOrganizationCalendarEvent } from "../infrastructure/index.js";

export async function updateOrganizationEvent(
  deps: { db: KyselyDB; userHasPermissionInOrganization: CheckOrganizationPermission },
  input: {
    id: string;
    organizationId: string;
    userId: string;
    title: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    allDay?: boolean;
    color: EventColor;
  },
): Promise<CalendarEvent> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.organizationId,
    permissions: { calendarEvent: ["update"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "update" });

  if (!isValidEventRange(input.startDate, input.endDate)) {
    throw conflict("End date must be after start date");
  }

  const updated = await updateOrganizationCalendarEvent(deps.db, {
    id: input.id,
    organizationId: input.organizationId,
    userId: input.userId,
    title: input.title,
    description: input.description ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    allDay: input.allDay ?? false,
    color: input.color,
  });

  if (!updated) throw notFound("CalendarEvent");
  return updated;
}
