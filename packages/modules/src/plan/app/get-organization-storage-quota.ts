import type { KyselyDB } from "@echo/db";
import { planCatalog } from "../domain/index.js";
import { getOrganizationStorageUsageQuery, resolvePlanQuery } from "../infrastructure/index.js";
import type { CheckOrganizationPermission } from "../../user/infrastructure/user-has-permission-in-organization.js";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { forbidden } from "@echo/errors";

export type OrganizationStorageQuota = { storageBytes: number; limitBytes: number };

export async function getOrganizationStorageQuota(
  deps: { db: KyselyDB; userHasPermissionInOrganization: CheckOrganizationPermission },
  input: { scope: OrganizationScope },
): Promise<OrganizationStorageQuota> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { quota: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Organization", action: "read" });

  const plan = await resolvePlanQuery(deps.db, input.scope);
  const storageBytes = await getOrganizationStorageUsageQuery(deps.db, input.scope);

  return { storageBytes, limitBytes: planCatalog[plan].limits.storageBytes };
}
