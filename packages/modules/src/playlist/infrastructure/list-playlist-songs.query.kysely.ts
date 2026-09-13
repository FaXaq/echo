import type { ListPlaylistSongsQueryPortFactory } from "./list-playlist-songs.query.port.js";

export const listPlaylistSongsQueryFactory: ListPlaylistSongsQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("playlist_song")
      .innerJoin("playlist", "playlist.id", "playlist_song.playlist_id")
      .innerJoin("song", "song.id", "playlist_song.song_id")
      .select(["song.id as song_id", "song.title as title", "song.artist as artist"])
      .where("playlist_song.playlist_id", "=", input.playlistId)
      .where("playlist.organization_id", "=", scope.organizationId)
      .orderBy("playlist_song.created_at", "asc")
      .execute();

    return rows.map((row) => ({ songId: row.song_id, title: row.title, artist: row.artist }));
  };
