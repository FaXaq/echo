import type { OrganizationScope } from "@echo/modules/shared/domain";
import { planCatalog } from "../domain/index.js";
import type { PlanEntitlements, PlanName } from "../domain/index.js";

export type ResolvePlanPort = (scope: OrganizationScope) => Promise<PlanName>;
export type ResolveEntitlementsPort = (scope: OrganizationScope) => Promise<PlanEntitlements>;
export type GetOrganizationStorageUsagePort = (scope: OrganizationScope) => Promise<number>;

export async function resolveEntitlements(
  deps: { resolvePlan: ResolvePlanPort },
  scope: OrganizationScope,
) {
  return planCatalog[await deps.resolvePlan(scope)];
}
