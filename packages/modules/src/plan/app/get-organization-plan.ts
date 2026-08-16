import type { KyselyDB } from "@echo/db";
import { planCatalog } from "../domain/index.js";
import type { PlanFeatures, PlanName } from "../domain/index.js";
import { getOrganizationSeatUsageQuery, resolvePlanQuery } from "../infrastructure/index.js";
import type { CheckOrganizationPermission } from "../../user/infrastructure/user-has-permission-in-organization.js";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { forbidden } from "@echo/errors";

export type OrganizationPlanOverview = {
  plan: PlanName;
  limits: { memberSeats: number; maxFileSizeBytes: number };
  features: PlanFeatures;
  usage: { memberSeats: number };
};

export async function getOrganizationPlan(
  deps: { db: KyselyDB; userHasPermissionInOrganization: CheckOrganizationPermission },
  input: { scope: OrganizationScope },
): Promise<OrganizationPlanOverview> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { plan: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Organization", action: "read" });

  const plan = await resolvePlanQuery(deps.db, input.scope);
  const { limits: planLimits, features } = planCatalog[plan];

  const memberSeats = await getOrganizationSeatUsageQuery(deps.db, input.scope);

  return {
    plan,
    limits: { memberSeats: planLimits.memberSeats, maxFileSizeBytes: planLimits.maxFileSizeBytes },
    features,
    usage: { memberSeats },
  };
}
