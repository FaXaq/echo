import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type RemoveSongFromPlaylistInput = { playlistId: string; songId: string };

export type RemoveSongFromPlaylistCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: RemoveSongFromPlaylistInput,
) => Promise<void>;

export type RemoveSongFromPlaylistCommandPortFactory = () => RemoveSongFromPlaylistCommandPort;
