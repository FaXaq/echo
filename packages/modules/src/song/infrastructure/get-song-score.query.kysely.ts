import type { GetSongScoreQueryPortFactory } from "./get-song-score.query.port.js";

export const getSongScoreQueryFactory: GetSongScoreQueryPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .selectFrom("song")
      .select(["title", "score"])
      .where("id", "=", input.songId)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return row ?? null;
  };
