import type { KyselyDB } from "@echo/db";
import { sql } from "kysely";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export async function getOrganizationStorageUsageQuery(db: KyselyDB, scope: OrganizationScope) {
  const row = await db
    .selectFrom("file")
    .select(sql<string>`coalesce(sum(size_bytes), 0)`.as("total"))
    .where("organization_id", "=", scope.organizationId)
    .where("status", "in", ["pending", "uploaded"])
    .executeTakeFirst();

  return Number(row?.total ?? 0);
}
