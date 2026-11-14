import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { ListRecentSongsQueryPort } from "../infrastructure/list-recent-songs.query.port.js";

export async function listRecentSongs(
  deps: { db: KyselyDB; listRecentSongsQuery: ListRecentSongsQueryPort },
  input: { scope: OrganizationScope; limit: number },
) {
  return deps.listRecentSongsQuery(deps.db, input.scope, { limit: input.limit });
}
