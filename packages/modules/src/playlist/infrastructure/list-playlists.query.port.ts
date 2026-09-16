import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Playlist } from "../domain/index.js";

export type ListPlaylistsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<Playlist[]>;

export type ListPlaylistsQueryPortFactory = () => ListPlaylistsQueryPort;
