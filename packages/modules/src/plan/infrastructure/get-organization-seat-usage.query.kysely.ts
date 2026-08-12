import type { KyselyDB } from "@echo/db";
import { sql } from "kysely";

export async function getOrganizationSeatUsageQuery(
  db: KyselyDB,
  organizationId: string,
  excludeInvitationId?: string,
) {
  const members = await db
    .selectFrom("member")
    .select(sql<string>`count(*)`.as("total"))
    .where("organizationId", "=", organizationId)
    .executeTakeFirst();

  let invitationsQuery = db
    .selectFrom("invitation")
    .select(sql<string>`count(*)`.as("total"))
    .where("organizationId", "=", organizationId)
    .where("status", "=", "pending")
    .where("expiresAt", ">", new Date());

  if (excludeInvitationId) {
    invitationsQuery = invitationsQuery.where("id", "!=", excludeInvitationId);
  }

  const invitations = await invitationsQuery.executeTakeFirst();

  return Number(members?.total ?? 0) + Number(invitations?.total ?? 0);
}
