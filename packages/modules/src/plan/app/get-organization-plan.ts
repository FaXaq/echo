import type { KyselyDB } from "@echo/db";
import { planCatalog } from "../domain/index.js";
import type { PlanFeatures, PlanLimits, PlanName } from "../domain/index.js";
import {
  getOrganizationSeatUsageQuery,
  getOrganizationStorageUsageQuery,
  resolvePlanQuery,
} from "../infrastructure/index.js";
import type { CheckOrganizationPermission } from "../../user/infrastructure/user-has-permission-in-organization.js";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { forbidden } from "@echo/errors";

export type OrganizationPlanOverview = {
  plan: PlanName;
  limits: PlanLimits;
  features: PlanFeatures;
  usage: { storageBytes: number; memberSeats: number };
};

export async function getOrganizationPlan(
  deps: { db: KyselyDB; userHasPermissionInOrganization: CheckOrganizationPermission },
  input: { scope: OrganizationScope },
): Promise<OrganizationPlanOverview> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { plan: ["read"], quota: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Organization", action: "read" });

  const plan = await resolvePlanQuery(deps.db, input.scope);
  const { limits, features } = planCatalog[plan];

  const [storageBytes, memberSeats] = await Promise.all([
    getOrganizationStorageUsageQuery(deps.db, input.scope),
    getOrganizationSeatUsageQuery(deps.db, input.scope),
  ]);

  return { plan, limits, features, usage: { storageBytes, memberSeats } };
}
