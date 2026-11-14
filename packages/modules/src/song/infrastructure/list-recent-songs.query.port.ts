import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song } from "../domain/index.js";

export type ListRecentSongsQueryInput = { limit: number };

export type ListRecentSongsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListRecentSongsQueryInput,
) => Promise<Song[]>;

export type ListRecentSongsQueryPortFactory = () => ListRecentSongsQueryPort;
