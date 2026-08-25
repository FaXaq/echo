import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export const makeSelectSongByIdQuery = (db: KyselyDB) => (scope: OrganizationScope, id: string) => {
  return db
    .selectFrom("song")
    .innerJoin("user", "user.id", "song.created_by")
    .selectAll("song")
    .select("user.name as created_by_name")
    .innerJoin("organization", "song.organization_id", "organization.id")
    .select(["organization.name as organization_name", "organization.slug as organization_slug"])
    .where("song.id", "=", id)
    .where("song.organization_id", "=", scope.organizationId)
    .executeTakeFirstOrThrow();
};
