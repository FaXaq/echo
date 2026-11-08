import type { MarkFileHasThumbnailCommandPortFactory } from "./mark-file-has-thumbnail.command.port.js";

export const markFileHasThumbnailCommandFactory: MarkFileHasThumbnailCommandPortFactory =
  () => async (db, input) => {
    await db
      .updateTable("file")
      .set({ has_thumbnail: true, updated_at: new Date() })
      .where("id", "=", input.id)
      .execute();
  };
