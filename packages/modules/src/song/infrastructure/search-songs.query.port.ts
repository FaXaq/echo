import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song } from "../domain/index.js";

export type SearchSongsQueryInput = { query: string };

export type SearchSongsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: SearchSongsQueryInput,
) => Promise<Song[]>;

export type SearchSongsQueryPortFactory = () => SearchSongsQueryPort;
