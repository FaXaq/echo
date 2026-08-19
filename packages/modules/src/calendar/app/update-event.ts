import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import {
  isValidEventRange,
  type CalendarEvent,
  type EventColor,
  type EventPlace,
  type EventType,
} from "../domain/index.js";
import type { UpdateCalendarEventCommandPort } from "../infrastructure/update-calendar-event.command.port.js";

export async function updateEvent(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    updateCalendarEventCommand: UpdateCalendarEventCommandPort;
  },
  input: {
    id: string;
    scope: OrganizationScope;
    userId: string;
    title: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    allDay?: boolean;
    color: EventColor;
    type?: EventType | null;
    place?: EventPlace | null;
  },
): Promise<CalendarEvent> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { calendarEvent: ["update"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "update" });

  if (!isValidEventRange(input.startDate, input.endDate)) {
    throw conflict("End date must be after start date");
  }

  const updated = await deps.updateCalendarEventCommand(deps.db, input.scope, {
    id: input.id,
    userId: input.userId,
    title: input.title,
    description: input.description ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    allDay: input.allDay ?? false,
    color: input.color,
    type: input.type ?? null,
    place: input.place ?? null,
  });

  if (!updated) throw notFound("CalendarEvent");
  return updated;
}
