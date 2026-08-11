import { planCatalog } from "../domain/index.js";
import type { PlanEntitlements, PlanName } from "../domain/index.js";

export type ResolvePlanPort = (organizationId: string) => Promise<PlanName>;
export type ResolveEntitlementsPort = (organizationId: string) => Promise<PlanEntitlements>;
export type GetOrganizationStorageUsagePort = (organizationId: string) => Promise<number>;

export async function resolveEntitlements(
  deps: { resolvePlan: ResolvePlanPort },
  organizationId: string,
) {
  return planCatalog[await deps.resolvePlan(organizationId)];
}
