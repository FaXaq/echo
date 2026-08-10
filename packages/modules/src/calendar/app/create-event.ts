import type { KyselyDB } from "@echo/db";
import { conflict, forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import {
  isValidEventRange,
  type CalendarEvent,
  type EventColor,
  type EventPlace,
  type EventType,
} from "../domain/index.js";
import type { InsertCalendarEventCommandPort } from "../infrastructure/insert-calendar-event.command.port.js";

export async function createEvent(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    insertCalendarEventCommand: InsertCalendarEventCommandPort;
  },
  input: {
    organizationId: string;
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
    organizationId: input.organizationId,
    permissions: { calendarEvent: ["create"] },
  });
  if (!success) throw forbidden({ entity: "CalendarEvent", action: "create" });

  if (!isValidEventRange(input.startDate, input.endDate)) {
    throw conflict("End date must be after start date");
  }

  return deps.insertCalendarEventCommand(deps.db, {
    id: crypto.randomUUID(),
    organizationId: input.organizationId,
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
}
