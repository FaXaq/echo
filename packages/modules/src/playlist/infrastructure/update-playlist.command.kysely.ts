import type { UpdatePlaylistCommandPortFactory } from "./update-playlist.command.port.js";
import { makeSelectPlaylistByIdQuery } from "./common.js";
import { toPlaylist } from "./map-playlist.js";

export const updatePlaylistCommandFactory: UpdatePlaylistCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable("playlist")
        .set({
          title: input.title,
          description: input.description,
          updated_by: input.userId,
          updated_at: new Date(),
        })
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("id")
        .executeTakeFirst();
      if (!updated) return null;

      const row = await makeSelectPlaylistByIdQuery(trx)(scope, updated.id);

      return toPlaylist(row);
    });
  };
