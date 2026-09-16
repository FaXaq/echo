import type { ListEventPlaylistsQueryPortFactory } from "./list-event-playlists.query.port.js";

export const listEventPlaylistsQueryFactory: ListEventPlaylistsQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("playlist_event")
      .innerJoin("playlist", "playlist.id", "playlist_event.playlist_id")
      .select(["playlist.id as id", "playlist.title as title"])
      .where("playlist_event.event_id", "=", input.eventId)
      .where("playlist.organization_id", "=", scope.organizationId)
      .orderBy("playlist_event.created_at", "asc")
      .execute();

    return rows;
  };
