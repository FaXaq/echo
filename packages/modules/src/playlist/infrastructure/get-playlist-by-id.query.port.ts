import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Playlist } from "../domain/index.js";

export type GetPlaylistByIdQueryInput = { playlistId: string };

export type GetPlaylistByIdQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: GetPlaylistByIdQueryInput,
) => Promise<Playlist | undefined>;

export type GetPlaylistByIdQueryPortFactory = () => GetPlaylistByIdQueryPort;
