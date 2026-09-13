import type { SearchPlaylistsQueryPortFactory } from "./search-playlists.query.port.js";

const SEARCH_RESULT_LIMIT = 10;

export const searchPlaylistsQueryFactory: SearchPlaylistsQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("playlist")
      .select(["id", "title"])
      .where("organization_id", "=", scope.organizationId)
      .where("title", "ilike", `%${input.query}%`)
      .orderBy("title", "asc")
      .limit(SEARCH_RESULT_LIMIT)
      .execute();

    return rows;
  };
