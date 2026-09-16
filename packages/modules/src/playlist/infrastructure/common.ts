import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export const makeSelectPlaylistByIdQuery =
  (db: KyselyDB) => (scope: OrganizationScope, id: string) => {
    return db
      .selectFrom("playlist")
      .innerJoin("user", "user.id", "playlist.created_by")
      .innerJoin("organization", "playlist.organization_id", "organization.id")
      .selectAll("playlist")
      .select("user.name as created_by_name")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("playlist.id", "=", id)
      .where("playlist.organization_id", "=", scope.organizationId)
      .executeTakeFirstOrThrow();
  };
