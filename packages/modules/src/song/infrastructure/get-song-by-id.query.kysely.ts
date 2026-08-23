import type { GetSongByIdQueryPortFactory } from "./get-song-by-id.query.port.js";
import { toSong } from "./map-song.js";

export const getSongByIdQueryFactory: GetSongByIdQueryPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .selectFrom("song")
      .innerJoin("user", "user.id", "created_by")
      .selectAll("song")
      .select("user.name as created_by_name")
      .innerJoin("organization", "song.organization_id", "organization.id")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("song.id", "=", input.songId)
      .where("song.organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return row ? toSong(row) : undefined;
  };
