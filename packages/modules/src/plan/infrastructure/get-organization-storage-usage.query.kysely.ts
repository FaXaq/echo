import { sql } from "kysely";
import type { GetOrganizationStorageUsageQueryPortFactory } from "./get-organization-storage-usage.query.port.js";

export const getOrganizationStorageUsageQueryFactory: GetOrganizationStorageUsageQueryPortFactory =
  () => async (db, scope) => {
    const row = await db
      .selectFrom("file")
      .select(sql<string>`coalesce(sum(size_bytes), 0)`.as("total"))
      .where("organization_id", "=", scope.organizationId)
      .where("status", "in", ["pending", "uploaded"])
      .executeTakeFirst();

    return Number(row?.total ?? 0);
  };
