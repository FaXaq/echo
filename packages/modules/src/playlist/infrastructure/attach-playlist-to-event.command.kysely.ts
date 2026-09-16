import type { AttachPlaylistToEventCommandPortFactory } from "./attach-playlist-to-event.command.port.js";

export const attachPlaylistToEventCommandFactory: AttachPlaylistToEventCommandPortFactory =
  () => async (db, scope, input) => {
    await db
      .insertInto("playlist_event")
      .columns(["playlist_id", "event_id"])
      .expression(
        db
          .selectNoFrom((eb) => [
            eb.val(input.playlistId).as("playlist_id"),
            eb.val(input.eventId).as("event_id"),
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
                .selectFrom("calendar_event")
                .select("id")
                .where("id", "=", input.eventId)
                .where("organization_id", "=", scope.organizationId),
            ),
          ),
      )
      .onConflict((oc) => oc.columns(["playlist_id", "event_id"]).doNothing())
      .execute();
  };
