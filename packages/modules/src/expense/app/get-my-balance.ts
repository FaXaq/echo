import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { GetMemberBalanceQueryPort } from "../infrastructure/get-member-balance.query.port.js";
import type { GetOrganizationCurrencyQueryPort } from "../infrastructure/get-organization-currency.query.port.js";

export async function getMyBalance(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    getMemberBalanceQuery: GetMemberBalanceQueryPort;
    getOrganizationCurrencyQuery: GetOrganizationCurrencyQueryPort;
  },
  input: { scope: OrganizationScope; userId: string },
) {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Expense", action: "read" });

  const [amountMinor, currency] = await Promise.all([
    deps.getMemberBalanceQuery(deps.db, input.scope, { userId: input.userId }),
    deps.getOrganizationCurrencyQuery(deps.db, input.scope),
  ]);
  return { amountMinor, currency };
}
