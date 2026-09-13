import { sql } from "kysely";
import type { AttachPlaylistToEventCommandPortFactory } from "./attach-playlist-to-event.command.port.js";

export const attachPlaylistToEventCommandFactory: AttachPlaylistToEventCommandPortFactory =
  () => async (db, scope, input) => {
    await sql`
      INSERT INTO playlist_event (playlist_id, event_id)
      SELECT ${input.playlistId}, ${input.eventId}
      WHERE EXISTS (
        SELECT 1 FROM playlist WHERE id = ${input.playlistId} AND organization_id = ${scope.organizationId}
      )
      AND EXISTS (
        SELECT 1 FROM calendar_event WHERE id = ${input.eventId} AND organization_id = ${scope.organizationId}
      )
      ON CONFLICT (playlist_id, event_id) DO NOTHING
    `.execute(db);
  };
