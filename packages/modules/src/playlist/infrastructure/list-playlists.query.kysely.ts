import type { ListPlaylistsQueryPortFactory } from "./list-playlists.query.port.js";
import { toPlaylist } from "./map-playlist.js";

export const listPlaylistsQueryFactory: ListPlaylistsQueryPortFactory = () => async (db, scope) => {
  const rows = await db
    .selectFrom("playlist")
    .innerJoin("user", "user.id", "playlist.created_by")
    .innerJoin("organization", "playlist.organization_id", "organization.id")
    .selectAll("playlist")
    .select("user.name as created_by_name")
    .select(["organization.name as organization_name", "organization.slug as organization_slug"])
    .where("playlist.organization_id", "=", scope.organizationId)
    .orderBy("playlist.title", "asc")
    .execute();

  return rows.map(toPlaylist);
};
