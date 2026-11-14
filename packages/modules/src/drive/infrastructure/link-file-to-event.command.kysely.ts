import type { LinkFileToEventCommandPortFactory } from "./link-file-to-event.command.port.js";

export const linkFileToEventCommandFactory: LinkFileToEventCommandPortFactory =
  () => async (db, scope, input) => {
    const target = await db
      .selectFrom(["file", "calendar_event"])
      .select("file.id")
      .where("file.id", "=", input.fileId)
      .where("file.organization_id", "=", scope.organizationId)
      .where("calendar_event.id", "=", input.eventId)
      .where("calendar_event.organization_id", "=", scope.organizationId)
      .executeTakeFirst();
    if (!target) return false;

    await db
      .insertInto("event_file")
      .values({ event_id: input.eventId, file_id: input.fileId, linked_by: input.linkedBy })
      .onConflict((oc) => oc.columns(["event_id", "file_id"]).doNothing())
      .execute();
    return true;
  };
