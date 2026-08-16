import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlanName } from "../domain/index.js";

export async function resolvePlanQuery(
  _db: KyselyDB,
  _scope: OrganizationScope,
): Promise<PlanName> {
  return "free";
}
