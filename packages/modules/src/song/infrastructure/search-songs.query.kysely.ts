import type { SearchSongsQueryPortFactory } from "./search-songs.query.port.js";
import { toSong } from "./map-song.js";

const SEARCH_RESULT_LIMIT = 10;

export const searchSongsQueryFactory: SearchSongsQueryPortFactory =
  () => async (db, scope, input) => {
    const pattern = `%${input.query}%`;

    const rows = await db
      .selectFrom("song")
      .innerJoin("user", "user.id", "created_by")
      .innerJoin("organization", "song.organization_id", "organization.id")
      .selectAll("song")
      .select("user.name as created_by_name")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("song.organization_id", "=", scope.organizationId)
      .where((eb) => eb.or([eb("title", "ilike", pattern), eb("artist", "ilike", pattern)]))
      .orderBy("title", "asc")
      .limit(SEARCH_RESULT_LIMIT)
      .execute();

    return rows.map(toSong);
  };
