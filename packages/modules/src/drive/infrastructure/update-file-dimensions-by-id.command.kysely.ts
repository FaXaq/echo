import type { UpdateFileDimensionsByIdCommandPortFactory } from "./update-file-dimensions-by-id.command.port.js";

export const updateFileDimensionsByIdCommandFactory: UpdateFileDimensionsByIdCommandPortFactory =
  () => async (db, input) => {
    await db
      .updateTable("file")
      .set({ width: input.width, height: input.height })
      .where("id", "=", input.id)
      .execute();
  };
