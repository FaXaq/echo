import type { KyselyDB } from "@echo/db";
import { conflict } from "@echo/errors";
import { isValidEventRange, type CalendarEvent, type EventColor } from "../domain/index.js";
import { insertUserCalendarEvent } from "../infrastructure/index.js";

export async function createUserEvent(
  deps: { db: KyselyDB },
  input: {
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

  return insertUserCalendarEvent(deps.db, {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title,
    description: input.description ?? null,
    startDate: input.startDate,
    endDate: input.endDate,
    allDay: input.allDay ?? false,
    color: input.color,
  });
}
