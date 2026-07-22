import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import { deleteUserCalendarEvent } from "../infrastructure/index.js";

export async function deleteUserEvent(
  deps: { db: KyselyDB },
  input: { id: string; userId: string },
): Promise<void> {
  const deleted = await deleteUserCalendarEvent(deps.db, input);
  if (!deleted) throw notFound("CalendarEvent");
}
