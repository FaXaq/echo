import { sql } from "kysely";
import type { ListRecentSongsQueryPortFactory } from "./list-recent-songs.query.port.js";
import { toSong } from "./map-song.js";

export const listRecentSongsQueryFactory: ListRecentSongsQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("song")
      .innerJoin("user", "user.id", "song.created_by")
      .selectAll("song")
      .select("user.name as created_by_name")
      .innerJoin("organization", "song.organization_id", "organization.id")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("song.organization_id", "=", scope.organizationId)
      .orderBy(sql`coalesce(song.updated_at, song.created_at)`, "desc")
      .limit(input.limit)
      .execute();

    return rows.map(toSong);
  };
