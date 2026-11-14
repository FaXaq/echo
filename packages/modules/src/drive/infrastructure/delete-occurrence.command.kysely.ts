import type { DeleteOccurrenceCommandPortFactory } from "./delete-occurrence.command.port.js";

export const deleteOccurrenceCommandFactory: DeleteOccurrenceCommandPortFactory =
  () =>
  async (db, scope, { fileId, place }) => {
    const fileInOrganization = db
      .selectFrom("file")
      .select("file.id")
      .where("file.id", "=", fileId)
      .where("file.organization_id", "=", scope.organizationId);

    switch (place.kind) {
      case "root":
      case "folder": {
        const query = db.deleteFrom("folder_file").where("file_id", "in", fileInOrganization);
        const result = await (
          place.kind === "folder"
            ? query.where("folder_id", "=", place.id)
            : query.where("folder_id", "is", null)
        ).executeTakeFirst();
        return result.numDeletedRows > 0n;
      }
      case "event": {
        const result = await db
          .deleteFrom("event_file")
          .where("event_id", "=", place.id)
          .where("file_id", "in", fileInOrganization)
          .executeTakeFirst();
        return result.numDeletedRows > 0n;
      }
      case "song": {
        const result = await db
          .deleteFrom("song_file")
          .where("song_id", "=", place.id)
          .where("file_id", "in", fileInOrganization)
          .executeTakeFirst();
        return result.numDeletedRows > 0n;
      }
    }
  };
