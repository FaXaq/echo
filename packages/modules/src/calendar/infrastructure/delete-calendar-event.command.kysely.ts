import type { DeleteCalendarEventCommandPortFactory } from "./delete-calendar-event.command.port.js";

export const deleteCalendarEventCommandFactory: DeleteCalendarEventCommandPortFactory =
  () => async (db, input) => {
    const result = await db
      .deleteFrom("calendar_event")
      .where("id", "=", input.id)
      .where("organization_id", "=", input.organizationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
