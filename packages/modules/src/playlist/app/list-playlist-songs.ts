import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlaylistSongEntry } from "../domain/index.js";
import type { ListPlaylistSongsQueryPort } from "../infrastructure/list-playlist-songs.query.port.js";

export async function listPlaylistSongs(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listPlaylistSongsQuery: ListPlaylistSongsQueryPort;
  },
  input: { playlistId: string; scope: OrganizationScope },
): Promise<PlaylistSongEntry[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "read" });

  return deps.listPlaylistSongsQuery(deps.db, input.scope, { playlistId: input.playlistId });
}
