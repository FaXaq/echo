import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { RemoveSongFromPlaylistCommandPort } from "../infrastructure/remove-song-from-playlist.command.port.js";

export async function removeSongFromPlaylist(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    removeSongFromPlaylistCommand: RemoveSongFromPlaylistCommandPort;
  },
  input: { playlistId: string; songId: string; scope: OrganizationScope },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "update" });

  await deps.removeSongFromPlaylistCommand(deps.db, input.scope, {
    playlistId: input.playlistId,
    songId: input.songId,
  });
}
