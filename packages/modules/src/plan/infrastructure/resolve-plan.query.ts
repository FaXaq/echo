import type { KyselyDB } from "@echo/db";
import type { PlanName } from "../domain/index.js";

export async function resolvePlanQuery(_db: KyselyDB, _organizationId: string): Promise<PlanName> {
  return "free";
}
