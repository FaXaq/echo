import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { ListSongAudioVersionsQueryPort } from "@echo/modules/drive/infrastructure";
import { selectDefaultSongFile } from "@echo/modules/song/domain";
import type { PlaylistWithStats } from "../domain/index.js";
import type { ListPlaylistsQueryPort } from "../infrastructure/list-playlists.query.port.js";
import type { ListPlaylistSongsQueryPort } from "../infrastructure/list-playlist-songs.query.port.js";

export async function listPlaylists(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listPlaylistsQuery: ListPlaylistsQueryPort;
    listPlaylistSongsQuery: ListPlaylistSongsQueryPort;
    listSongAudioVersionsQuery: ListSongAudioVersionsQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<PlaylistWithStats[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "read" });

  const playlists = await deps.listPlaylistsQuery(deps.db, input.scope);

  return Promise.all(
    playlists.map(async (playlist) => {
      const songs = await deps.listPlaylistSongsQuery(deps.db, input.scope, {
        playlistId: playlist.id,
      });
      const durations = await Promise.all(
        songs.map(async (song) => {
          const files = await deps.listSongAudioVersionsQuery(deps.db, input.scope, {
            songId: song.songId,
          });
          return selectDefaultSongFile(files)?.durationSeconds ?? 0;
        }),
      );

      const songsDurationSeconds = durations.reduce((total, duration) => total + duration, 0);
      const gapsSeconds =
        songs.length > 1 ? (songs.length - 1) * (playlist.intervalSeconds ?? 0) : 0;

      return {
        ...playlist,
        songCount: songs.length,
        totalDurationSeconds: songsDurationSeconds + gapsSeconds,
      };
    }),
  );
}
