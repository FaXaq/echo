import type { UpdateSongLyricsCommandPortFactory } from "./update-song-lyrics.command.port.js";
import { makeSelectSongByIdQuery } from "./common.js";
import { toSong } from "./map-song.js";

export const updateSongLyricsCommandFactory: UpdateSongLyricsCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable("song")
        .set({ lyrics: input.lyrics, updated_by: input.userId, updated_at: new Date() })
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("id")
        .executeTakeFirst();
      if (!updated) return null;

      const row = await makeSelectSongByIdQuery(trx)(scope, updated.id);

      return toSong(row);
    });
  };
