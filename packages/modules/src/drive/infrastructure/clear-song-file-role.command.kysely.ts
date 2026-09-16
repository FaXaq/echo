import type { ClearSongFileRoleCommandPortFactory } from "./clear-song-file-role.command.port.js";
import { songAndFileBelongToOrganization } from "./common.js";

export const clearSongFileRoleCommandFactory: ClearSongFileRoleCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .updateTable("song_file")
      .set({ role: null, version: null })
      .where("song_id", "=", input.songId)
      .where("file_id", "=", input.fileId)
      .where((eb) => songAndFileBelongToOrganization(eb, db, scope, input.songId, input.fileId))
      .executeTakeFirst();

    return (result.numUpdatedRows ?? 0n) > 0n;
  };
