import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type MoveSongInPlaylistInput = { playlistId: string; songId: string; position: number };

export type MoveSongInPlaylistCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: MoveSongInPlaylistInput,
) => Promise<boolean>;

export type MoveSongInPlaylistCommandPortFactory = () => MoveSongInPlaylistCommandPort;
