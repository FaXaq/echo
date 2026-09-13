import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlaylistSummary } from "../domain/index.js";

export type SearchPlaylistsQueryInput = { query: string };

export type SearchPlaylistsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: SearchPlaylistsQueryInput,
) => Promise<PlaylistSummary[]>;

export type SearchPlaylistsQueryPortFactory = () => SearchPlaylistsQueryPort;
