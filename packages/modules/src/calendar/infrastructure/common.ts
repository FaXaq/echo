import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export const makeSelectCalendarEventByIdQuery =
  (db: KyselyDB) => (scope: OrganizationScope, id: string) => {
    return db
      .selectFrom("calendar_event")
      .innerJoin("user", "user.id", "calendar_event.created_by")
      .selectAll("calendar_event")
      .select("user.name as created_by_name")
      .innerJoin("organization", "calendar_event.organization_id", "organization.id")
      .select(["organization.name as organization_name", "organization.slug as organization_slug"])
      .where("calendar_event.id", "=", id)
      .where("calendar_event.organization_id", "=", scope.organizationId)
      .executeTakeFirstOrThrow();
  };
