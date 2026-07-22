import type { KyselyDB } from "@echo/db";
import { conflict, notFound } from "@echo/errors";
import { isValidEventRange, type CalendarEvent, type EventColor } from "../domain/index.js";
import { updateUserCalendarEvent } from "../infrastructure/index.js";

export async function updateUserEvent(
  deps: { db: KyselyDB },
  input: {
    id: string;
    userId: string;
    title: string;
    description?: string | null;
    startDate: Date;
    endDate: Date;
    allDay?: boolean;
    color: EventColor;
  },
): Promise<CalendarEvent> {
  if (!isValidEventRange(input.startDate, input.endDate)) {
    throw conflict("End date must be after start date");
  }

  const updated = await updateUserCalendarEvent(deps.db, {
    id: input.id,
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
