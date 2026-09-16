import type { GetPlaylistByIdQueryPortFactory } from "./get-playlist-by-id.query.port.js";
import { toPlaylist } from "./map-playlist.js";

export const getPlaylistByIdQueryFactory: GetPlaylistByIdQueryPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .selectFrom("playlist")
      .innerJoin("user", "user.id", "playlist.created_by")
      .innerJoin("organization", "playlist.organization_id", "organization.id")
      .selectAll("playlist")
      .select("user.name as created_by_name")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("playlist.id", "=", input.playlistId)
      .where("playlist.organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return row ? toPlaylist(row) : undefined;
  };
