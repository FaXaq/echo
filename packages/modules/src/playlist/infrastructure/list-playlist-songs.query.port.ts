import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlaylistSongEntry } from "../domain/index.js";

export type ListPlaylistSongsQueryInput = { playlistId: string };

export type ListPlaylistSongsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListPlaylistSongsQueryInput,
) => Promise<PlaylistSongEntry[]>;

export type ListPlaylistSongsQueryPortFactory = () => ListPlaylistSongsQueryPort;
