import type { KyselyDB } from "@echo/db";
import { sql } from "kysely";

export async function getOrganizationStorageUsageQuery(db: KyselyDB, organizationId: string) {
  const row = await db
    .selectFrom("file")
    .select(sql<string>`coalesce(sum(size_bytes), 0)`.as("total"))
    .where("organization_id", "=", organizationId)
    .where("status", "in", ["pending", "uploaded"])
    .executeTakeFirst();

  return Number(row?.total ?? 0);
}
