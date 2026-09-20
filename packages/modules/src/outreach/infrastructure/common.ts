import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export const makeSelectOutreachCardByIdQuery =
  (db: KyselyDB) => (scope: OrganizationScope, id: string) =>
    db
      .selectFrom("outreach_card")
      .leftJoin("user", "user.id", "outreach_card.assignee_id")
      .selectAll("outreach_card")
      .select("user.name as assignee_name")
      .where("outreach_card.id", "=", id)
      .where("outreach_card.organization_id", "=", scope.organizationId)
      .executeTakeFirstOrThrow();
