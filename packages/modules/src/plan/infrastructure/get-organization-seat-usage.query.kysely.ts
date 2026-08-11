import type { KyselyDB } from "@echo/db";
import { sql } from "kysely";

export async function getOrganizationSeatUsageQuery(db: KyselyDB, organizationId: string) {
  const members = await db
    .selectFrom("member")
    .select(sql<string>`count(*)`.as("total"))
    .where("organizationId", "=", organizationId)
    .executeTakeFirst();

  const invitations = await db
    .selectFrom("invitation")
    .select(sql<string>`count(*)`.as("total"))
    .where("organizationId", "=", organizationId)
    .where("status", "=", "pending")
    .where("expiresAt", ">", new Date())
    .executeTakeFirst();

  return Number(members?.total ?? 0) + Number(invitations?.total ?? 0);
}
