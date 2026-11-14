import type { DeleteCalendarEventCommandPortFactory } from "./delete-calendar-event.command.port.js";

export const deleteCalendarEventCommandFactory: DeleteCalendarEventCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const links = await trx
        .selectFrom("event_file")
        .select("file_id")
        .where("event_id", "=", input.id)
        .execute();

      const result = await trx
        .deleteFrom("calendar_event")
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .executeTakeFirst();

      if (result.numDeletedRows === 0n) return null;
      return { fileIds: links.map((link) => link.file_id) };
    });
  };
