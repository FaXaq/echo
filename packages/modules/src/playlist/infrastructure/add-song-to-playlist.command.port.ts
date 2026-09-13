import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type AddSongToPlaylistInput = { playlistId: string; songId: string };

export type AddSongToPlaylistCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: AddSongToPlaylistInput,
) => Promise<void>;

export type AddSongToPlaylistCommandPortFactory = () => AddSongToPlaylistCommandPort;
