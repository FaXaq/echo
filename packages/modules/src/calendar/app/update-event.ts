import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import {
  isValidEventRange,
  type CalendarEvent,
  type EventColor,
  type EventPlace,
} from "../domain/index.js";
import { updateCalendarEvent } from "../infrastructure/index.js";

export async function updateEvent(
  deps: { db: KyselyDB; userHasPermissionInOrganization: CheckOrganizationPermission },
  input: {
    id: string;
    organizationId: string | null;
    userId: string;
    title: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    allDay?: boolean;
    color: EventColor;
    place?: EventPlace | null;
  },
): Promise<CalendarEvent> {
  if (input.organizationId !== null) {
    const { success } = await deps.userHasPermissionInOrganization({
      organizationId: input.organizationId,
      permissions: { calendarEvent: ["update"] },
    });
    console.log(success);
    if (!success) throw forbidden({ entity: "CalendarEvent", action: "update" });
  }

  if (!isValidEventRange(input.startDate, input.endDate)) {
    throw conflict("End date must be after start date");
  }

  const updated = await updateCalendarEvent(deps.db, {
    id: input.id,
    organizationId: input.organizationId,
    userId: input.userId,
    title: input.title,
    description: input.description ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    allDay: input.allDay ?? false,
    color: input.color,
    place: input.place ?? null,
  });

  if (!updated) throw notFound("CalendarEvent");
  return updated;
}
