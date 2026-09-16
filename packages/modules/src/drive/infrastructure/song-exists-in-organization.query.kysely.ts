import type { SongExistsInOrganizationQueryPortFactory } from "./song-exists-in-organization.query.port.js";

export const songExistsInOrganizationQueryFactory: SongExistsInOrganizationQueryPortFactory =
  () => async (db, scope, input) => {
    const row = await db
      .selectFrom("song")
      .select("song.id")
      .where("song.id", "=", input.songId)
      .where("song.organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return row !== undefined;
  };
