import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song } from "../domain/index.js";
import type { ListSongsQueryPort } from "../infrastructure/list-songs.query.port.js";

export async function listSongs(
  deps: { db: KyselyDB; listSongsQuery: ListSongsQueryPort },
  input: { scope: OrganizationScope },
): Promise<Song[]> {
  return deps.listSongsQuery(deps.db, input.scope);
}
