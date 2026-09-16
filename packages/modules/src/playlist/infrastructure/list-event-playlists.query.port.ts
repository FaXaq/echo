import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlaylistSummary } from "../domain/index.js";

export type ListEventPlaylistsQueryInput = { eventId: string };

export type ListEventPlaylistsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListEventPlaylistsQueryInput,
) => Promise<PlaylistSummary[]>;

export type ListEventPlaylistsQueryPortFactory = () => ListEventPlaylistsQueryPort;
