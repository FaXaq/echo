import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import { computeReorderPosition, type OrganizationScope } from "@echo/modules/shared/domain";
import type { ListPlaylistSongsQueryPort } from "../infrastructure/list-playlist-songs.query.port.js";
import type { MoveSongInPlaylistCommandPort } from "../infrastructure/move-song-in-playlist.command.port.js";

export async function moveSongInPlaylist(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listPlaylistSongsQuery: ListPlaylistSongsQueryPort;
    moveSongInPlaylistCommand: MoveSongInPlaylistCommandPort;
  },
  input: {
    scope: OrganizationScope;
    playlistId: string;
    songId: string;
    beforeId: string | null;
    afterId: string | null;
  },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "update" });

  const songs = await deps.listPlaylistSongsQuery(deps.db, input.scope, {
    playlistId: input.playlistId,
  });
  const before = input.beforeId ? songs.find((song) => song.songId === input.beforeId) : undefined;
  const after = input.afterId ? songs.find((song) => song.songId === input.afterId) : undefined;

  const position = computeReorderPosition({
    before: before?.position ?? null,
    after: after?.position ?? null,
  });

  const moved = await deps.moveSongInPlaylistCommand(deps.db, input.scope, {
    playlistId: input.playlistId,
    songId: input.songId,
    position,
  });
  if (!moved) throw notFound("Playlist");
}
