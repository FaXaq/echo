import type { AddSongToPlaylistCommandPortFactory } from "./add-song-to-playlist.command.port.js";

export const addSongToPlaylistCommandFactory: AddSongToPlaylistCommandPortFactory =
  () => async (db, scope, input) => {
    await db
      .insertInto("playlist_song")
      .columns(["playlist_id", "song_id"])
      .expression(
        db
          .selectNoFrom((eb) => [
            eb.val(input.playlistId).as("playlist_id"),
            eb.val(input.songId).as("song_id"),
          ])
          .where((eb) =>
            eb.exists(
              db
                .selectFrom("playlist")
                .select("id")
                .where("id", "=", input.playlistId)
                .where("organization_id", "=", scope.organizationId),
            ),
          )
          .where((eb) =>
            eb.exists(
              db
                .selectFrom("song")
                .select("id")
                .where("id", "=", input.songId)
                .where("organization_id", "=", scope.organizationId),
            ),
          ),
      )
      .onConflict((oc) => oc.columns(["playlist_id", "song_id"]).doNothing())
      .execute();
  };
