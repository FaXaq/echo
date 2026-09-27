import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { AddSongToPlaylistCommandPort } from "../infrastructure/add-song-to-playlist.command.port.js";
import type { ListPlaylistSongsQueryPort } from "../infrastructure/list-playlist-songs.query.port.js";

export async function addSongToPlaylist(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listPlaylistSongsQuery: ListPlaylistSongsQueryPort;
    addSongToPlaylistCommand: AddSongToPlaylistCommandPort;
  },
  input: { playlistId: string; songId: string; scope: OrganizationScope },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "update" });

  const songs = await deps.listPlaylistSongsQuery(deps.db, input.scope, {
    playlistId: input.playlistId,
  });
  const lastPosition = songs.reduce((max, song) => Math.max(max, song.position), -1);

  await deps.addSongToPlaylistCommand(deps.db, input.scope, {
    playlistId: input.playlistId,
    songId: input.songId,
    position: lastPosition + 1,
  });
}
