import type { KyselyDB } from "@echo/db";
import { sql } from "kysely";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export async function getOrganizationSeatUsageQuery(
  db: KyselyDB,
  scope: OrganizationScope,
  excludeInvitationId?: string,
) {
  const members = await db
    .selectFrom("member")
    .select(sql<string>`count(*)`.as("total"))
    .where("organizationId", "=", scope.organizationId)
    .executeTakeFirst();

  let invitationsQuery = db
    .selectFrom("invitation")
    .select(sql<string>`count(*)`.as("total"))
    .where("organizationId", "=", scope.organizationId)
    .where("status", "=", "pending")
    .where("expiresAt", ">", new Date());

  if (excludeInvitationId) {
    invitationsQuery = invitationsQuery.where("id", "!=", excludeInvitationId);
  }

  const invitations = await invitationsQuery.executeTakeFirst();

  return Number(members?.total ?? 0) + Number(invitations?.total ?? 0);
}
