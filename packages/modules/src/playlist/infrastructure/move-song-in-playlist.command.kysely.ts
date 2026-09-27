import type { MoveSongInPlaylistCommandPortFactory } from "./move-song-in-playlist.command.port.js";

export const moveSongInPlaylistCommandFactory: MoveSongInPlaylistCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .updateTable("playlist_song")
      .set({ position: input.position })
      .where("playlist_id", "=", input.playlistId)
      .where("song_id", "=", input.songId)
      .where((eb) =>
        eb.exists(
          db
            .selectFrom("playlist")
            .select("id")
            .where("id", "=", input.playlistId)
            .where("organization_id", "=", scope.organizationId),
        ),
      )
      .executeTakeFirst();

    return result.numUpdatedRows > 0n;
  };
