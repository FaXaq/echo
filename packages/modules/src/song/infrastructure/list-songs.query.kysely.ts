import type { ListSongsQueryPortFactory } from "./list-songs.query.port.js";
import { toSong } from "./map-song.js";

export const listSongsQueryFactory: ListSongsQueryPortFactory = () => async (db, scope) => {
  const rows = await db
    .selectFrom("song")
    .innerJoin("user", "user.id", "song.created_by")
    .selectAll("song")
    .select("user.name as created_by_name")
    .innerJoin("organization", "song.organization_id", "organization.id")
    .select(["organization.name as organization_name", "organization.slug as organization_slug"])
    .where("song.organization_id", "=", scope.organizationId)
    .orderBy("song.title", "asc")
    .execute();

  return rows.map(toSong);
};
