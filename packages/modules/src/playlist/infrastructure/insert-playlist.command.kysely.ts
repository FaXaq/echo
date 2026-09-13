import type { InsertPlaylistCommandPortFactory } from "./insert-playlist.command.port.js";
import { makeSelectPlaylistByIdQuery } from "./common.js";
import { toPlaylist } from "./map-playlist.js";

export const insertPlaylistCommandFactory: InsertPlaylistCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const { id } = await trx
        .insertInto("playlist")
        .values({
          id: input.id,
          title: input.title,
          description: input.description,
          organization_id: scope.organizationId,
          created_by: input.userId,
          updated_by: input.userId,
        })
        .returning("id")
        .executeTakeFirstOrThrow();

      const row = await makeSelectPlaylistByIdQuery(trx)(scope, id);

      return toPlaylist(row);
    });
  };
