import type { LinkFileToEventCommandPortFactory } from "./link-file-to-event.command.port.js";

export const linkFileToEventCommandFactory: LinkFileToEventCommandPortFactory =
  () => async (db, scope, input) => {
    const updated = await db
      .updateTable("file")
      .set({ event_id: input.eventId, updated_at: new Date() })
      .where("id", "=", input.fileId)
      .where("organization_id", "=", scope.organizationId)
      .where(({ exists, selectFrom }) =>
        exists(
          selectFrom("calendar_event")
            .select("calendar_event.id")
            .where("calendar_event.id", "=", input.eventId)
            .where("calendar_event.organization_id", "=", scope.organizationId),
        ),
      )
      .returning("file.id")
      .executeTakeFirst();

    return updated !== undefined;
  };
