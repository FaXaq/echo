import type { KyselyDB } from "@echo/db";
import { planCatalog } from "../domain/index.js";
import type {
  GetOrganizationStorageUsageQueryPort,
  ResolvePlanQueryPort,
} from "../infrastructure/index.js";
import type { CheckOrganizationPermission } from "../../user/infrastructure/index.js";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { forbidden } from "@echo/errors";

export type OrganizationStorageQuota = { storageBytes: number; limitBytes: number };

export async function getOrganizationStorageQuota(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    resolvePlanQuery: ResolvePlanQueryPort;
    getOrganizationStorageUsageQuery: GetOrganizationStorageUsageQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<OrganizationStorageQuota> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { quota: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Organization", action: "read" });

  const plan = await deps.resolvePlanQuery(deps.db, input.scope);
  const storageBytes = await deps.getOrganizationStorageUsageQuery(deps.db, input.scope);

  return { storageBytes, limitBytes: planCatalog[plan].limits.storageBytes };
}
