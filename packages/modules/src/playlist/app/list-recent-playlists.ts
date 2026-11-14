import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { ListSongAudioVersionsQueryPort } from "@echo/modules/drive/infrastructure";
import type { ListRecentPlaylistsQueryPort } from "../infrastructure/list-recent-playlists.query.port.js";
import type { ListPlaylistSongsQueryPort } from "../infrastructure/list-playlist-songs.query.port.js";
import { withPlaylistStats } from "./list-playlists.js";

export async function listRecentPlaylists(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listRecentPlaylistsQuery: ListRecentPlaylistsQueryPort;
    listPlaylistSongsQuery: ListPlaylistSongsQueryPort;
    listSongAudioVersionsQuery: ListSongAudioVersionsQueryPort;
  },
  input: { scope: OrganizationScope; limit: number },
) {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "read" });

  const playlists = await deps.listRecentPlaylistsQuery(deps.db, input.scope, {
    limit: input.limit,
  });
  return Promise.all(playlists.map((playlist) => withPlaylistStats(deps, input.scope, playlist)));
}
