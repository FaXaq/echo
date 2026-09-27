import type { UpdateFileDurationByIdCommandPortFactory } from "./update-file-duration-by-id.command.port.js";

export const updateFileDurationByIdCommandFactory: UpdateFileDurationByIdCommandPortFactory =
  () => async (db, input) => {
    await db
      .updateTable("file")
      .set({ duration_seconds: input.durationSeconds, updated_at: new Date() })
      .where("id", "=", input.id)
      .execute();
  };
