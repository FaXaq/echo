import { sql } from "kysely";
import type { AddSongToPlaylistCommandPortFactory } from "./add-song-to-playlist.command.port.js";

export const addSongToPlaylistCommandFactory: AddSongToPlaylistCommandPortFactory =
  () => async (db, scope, input) => {
    await sql`
      INSERT INTO playlist_song (playlist_id, song_id)
      SELECT ${input.playlistId}, ${input.songId}
      WHERE EXISTS (
        SELECT 1 FROM playlist WHERE id = ${input.playlistId} AND organization_id = ${scope.organizationId}
      )
      AND EXISTS (
        SELECT 1 FROM song WHERE id = ${input.songId} AND organization_id = ${scope.organizationId}
      )
      ON CONFLICT (playlist_id, song_id) DO NOTHING
    `.execute(db);
  };
