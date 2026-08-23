import type { InsertSongCommandPortFactory } from "./insert-song.command.port.js";
import { makeSelectSongByIdQuery } from "./common.js";
import { toSong } from "./map-song.js";

export const insertSongCommandFactory: InsertSongCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const { id } = await trx
        .insertInto("song")
        .values({
          id: input.id,
          title: input.title,
          artist: input.artist,
          bpm: input.bpm,
          key: input.key,
          type: input.type,
          organization_id: scope.organizationId,
          created_by: input.userId,
          updated_by: input.userId,
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      const row = await makeSelectSongByIdQuery(trx)(scope, id);

      return toSong(row);
    });
  };
