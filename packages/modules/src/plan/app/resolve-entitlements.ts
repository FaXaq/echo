import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { planCatalog } from "../domain/index.js";
import type { PlanEntitlements } from "../domain/index.js";
import type { ResolvePlanQueryPort } from "../infrastructure/index.js";

export type ResolveEntitlementsPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<PlanEntitlements>;

export async function resolveEntitlements(
  deps: { resolvePlanQuery: ResolvePlanQueryPort },
  input: { db: KyselyDB; scope: OrganizationScope },
): Promise<PlanEntitlements> {
  return planCatalog[await deps.resolvePlanQuery(input.db, input.scope)];
}
