import type { KyselyDB } from "@echo/db";
import { planCatalog } from "../domain/index.js";
import { getOrganizationSeatUsageQuery, resolvePlanQuery } from "../infrastructure/index.js";

export function seatIsAvailable({ used, limit }: { used: number; limit: number }) {
  return used < limit;
}

export async function hasSeatAvailable(deps: { db: KyselyDB }, input: { organizationId: string }) {
  const plan = await resolvePlanQuery(deps.db, input.organizationId);
  const used = await getOrganizationSeatUsageQuery(deps.db, input.organizationId);
  return seatIsAvailable({ used, limit: planCatalog[plan].limits.memberSeats });
}
