import type { DeleteCalendarEventCommandPortFactory } from "./delete-calendar-event.command.port.js";

export const deleteCalendarEventCommandFactory: DeleteCalendarEventCommandPortFactory =
  () => async (db, input) => {
    let query = db.deleteFrom("calendar_event").where("id", "=", input.id);

    if (input.organizationId === null) {
      query = query.where("organization_id", "is", null).where("created_by", "=", input.userId);
    } else {
      query = query.where("organization_id", "=", input.organizationId);
    }

    const result = await query.executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
