import type { DetachPlaylistFromEventCommandPortFactory } from "./detach-playlist-from-event.command.port.js";

export const detachPlaylistFromEventCommandFactory: DetachPlaylistFromEventCommandPortFactory =
  () => async (db, scope, input) => {
    await db
      .deleteFrom("playlist_event")
      .where("playlist_id", "=", input.playlistId)
      .where("event_id", "=", input.eventId)
      .where(
        "playlist_id",
        "in",
        db.selectFrom("playlist").select("id").where("organization_id", "=", scope.organizationId),
      )
      .execute();
  };
