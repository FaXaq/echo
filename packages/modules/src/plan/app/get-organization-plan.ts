import type { KyselyDB } from "@echo/db";
import { planCatalog } from "../domain/index.js";
import type { PlanFeatures, PlanLimits, PlanName } from "../domain/index.js";
import {
  getOrganizationSeatUsageQuery,
  getOrganizationStorageUsageQuery,
  resolvePlanQuery,
} from "../infrastructure/index.js";

export type OrganizationPlanOverview = {
  plan: PlanName;
  limits: PlanLimits;
  features: PlanFeatures;
  usage: { storageBytes: number; memberSeats: number };
};

export async function getOrganizationPlan(
  deps: { db: KyselyDB },
  input: { organizationId: string },
): Promise<OrganizationPlanOverview> {
  const plan = await resolvePlanQuery(deps.db, input.organizationId);
  const { limits, features } = planCatalog[plan];

  const [storageBytes, memberSeats] = await Promise.all([
    getOrganizationStorageUsageQuery(deps.db, input.organizationId),
    getOrganizationSeatUsageQuery(deps.db, input.organizationId),
  ]);

  return { plan, limits, features, usage: { storageBytes, memberSeats } };
}
