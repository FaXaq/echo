import type { KyselyDB } from "@echo/db";
import { conflict, forbidden } from "@echo/errors";
import type { UserPermissionRepoPort } from "@echo/modules/user/infrastructure";
import { isValidEventRange, type CalendarEvent, type EventColor } from "../domain/index.js";
import { insertOrganizationCalendarEvent } from "../infrastructure/index.js";

export async function createOrganizationEvent(
  deps: { db: KyselyDB; userPermission: UserPermissionRepoPort },
  input: {
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
  const { success } = await deps.userPermission.userHasPermissionInOrganization({
    organizationId: input.organizationId,
    permissions: { calendarEvent: ["create"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "create" });

  if (!isValidEventRange(input.startDate, input.endDate)) {
    throw conflict("End date must be after start date");
  }

  return insertOrganizationCalendarEvent(deps.db, {
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
    userId: input.userId,
    title: input.title,
    description: input.description ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    allDay: input.allDay ?? false,
    color: input.color,
  });
}
