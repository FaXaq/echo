import type { RemoveSongFromPlaylistCommandPortFactory } from "./remove-song-from-playlist.command.port.js";

export const removeSongFromPlaylistCommandFactory: RemoveSongFromPlaylistCommandPortFactory =
  () => async (db, scope, input) => {
    await db
      .deleteFrom("playlist_song")
      .where("playlist_id", "=", input.playlistId)
      .where("song_id", "=", input.songId)
      .where(
        "playlist_id",
        "in",
        db.selectFrom("playlist").select("id").where("organization_id", "=", scope.organizationId),
      )
      .execute();
  };
