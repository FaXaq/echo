import type { DeleteOccurrencesCommandPortFactory } from "./delete-occurrences.command.port.js";

export const deleteOccurrencesCommandFactory: DeleteOccurrencesCommandPortFactory =
  () =>
  async (db, scope, { fileIds, place }) => {
    if (fileIds.length === 0) return [];

    const filesInOrganization = db
      .selectFrom("file")
      .select("file.id")
      .where("file.id", "in", fileIds)
      .where("file.organization_id", "=", scope.organizationId);

    switch (place.kind) {
      case "root":
      case "folder": {
        const query = db.deleteFrom("folder_file").where("file_id", "in", filesInOrganization);
        const rows = await (
          place.kind === "folder"
            ? query.where("folder_id", "=", place.id)
            : query.where("folder_id", "is", null)
        )
          .returning("file_id")
          .execute();
        return rows.map((row) => row.file_id);
      }
      case "event": {
        const rows = await db
          .deleteFrom("event_file")
          .where("event_id", "=", place.id)
          .where("file_id", "in", filesInOrganization)
          .returning("file_id")
          .execute();
        return rows.map((row) => row.file_id);
      }
      case "song": {
        const rows = await db
          .deleteFrom("song_file")
          .where("song_id", "=", place.id)
          .where("file_id", "in", filesInOrganization)
          .returning("file_id")
          .execute();
        return rows.map((row) => row.file_id);
      }
    }
  };
