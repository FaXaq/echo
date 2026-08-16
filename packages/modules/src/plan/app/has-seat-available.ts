import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { planCatalog } from "../domain/index.js";
import { getOrganizationSeatUsageQuery, resolvePlanQuery } from "../infrastructure/index.js";

export function seatIsAvailable({ used, limit }: { used: number; limit: number }) {
  return used < limit;
}

export async function hasSeatAvailable(
  deps: { db: KyselyDB },
  input: { scope: OrganizationScope; excludeInvitationId?: string },
) {
  const plan = await resolvePlanQuery(deps.db, input.scope);
  const used = await getOrganizationSeatUsageQuery(deps.db, input.scope, input.excludeInvitationId);
  return seatIsAvailable({ used, limit: planCatalog[plan].limits.memberSeats });
}
