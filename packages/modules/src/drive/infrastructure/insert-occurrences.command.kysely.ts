import type { InsertOccurrencesCommandPortFactory } from "./insert-occurrences.command.port.js";

export const insertOccurrencesCommandFactory: InsertOccurrencesCommandPortFactory =
  () =>
  async (db, _scope, { fileIds, place, addedBy }) => {
    if (fileIds.length === 0) return;

    switch (place.kind) {
      case "root":
      case "folder":
        await db
          .insertInto("folder_file")
          .values(
            fileIds.map((fileId) => ({
              file_id: fileId,
              folder_id: place.kind === "folder" ? place.id : null,
              placed_by: addedBy,
            })),
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
        return;
      case "event":
        await db
          .insertInto("event_file")
          .values(
            fileIds.map((fileId) => ({ event_id: place.id, file_id: fileId, linked_by: addedBy })),
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
        return;
      case "song":
        await db
          .insertInto("song_file")
          .values(
            fileIds.map((fileId) => ({ song_id: place.id, file_id: fileId, linked_by: addedBy })),
          )
          .onConflict((oc) => oc.doNothing())
          .execute();
    }
  };
