import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { planCatalog } from "../domain/index.js";
import type {
  GetOrganizationSeatUsageQueryPort,
  ResolvePlanQueryPort,
} from "../infrastructure/index.js";

export function seatIsAvailable({ used, limit }: { used: number; limit: number }) {
  return used < limit;
}

export async function hasSeatAvailable(
  deps: {
    db: KyselyDB;
    resolvePlanQuery: ResolvePlanQueryPort;
    getOrganizationSeatUsageQuery: GetOrganizationSeatUsageQueryPort;
  },
  input: { scope: OrganizationScope; excludeInvitationId?: string },
) {
  const plan = await deps.resolvePlanQuery(deps.db, input.scope);
  const used = await deps.getOrganizationSeatUsageQuery(deps.db, input.scope, {
    excludeInvitationId: input.excludeInvitationId,
  });
  return seatIsAvailable({ used, limit: planCatalog[plan].limits.memberSeats });
}
