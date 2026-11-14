import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Playlist } from "../domain/index.js";

export type ListRecentPlaylistsQueryInput = { limit: number };

export type ListRecentPlaylistsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListRecentPlaylistsQueryInput,
) => Promise<(Playlist & { songCount: number })[]>;

export type ListRecentPlaylistsQueryPortFactory = () => ListRecentPlaylistsQueryPort;
