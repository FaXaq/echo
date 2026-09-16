import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song } from "../domain/index.js";
import type { SearchSongsQueryPort } from "../infrastructure/search-songs.query.port.js";

export async function searchSongs(
  deps: { db: KyselyDB; searchSongsQuery: SearchSongsQueryPort },
  input: { scope: OrganizationScope; query: string },
): Promise<Song[]> {
  return deps.searchSongsQuery(deps.db, input.scope, { query: input.query });
}
