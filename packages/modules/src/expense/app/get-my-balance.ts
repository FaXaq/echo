import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import { computeBalances } from "../domain/index.js";
import type { GetOrganizationCurrencyQueryPort } from "../infrastructure/get-organization-currency.query.port.js";
import type { ListExpensesQueryPort } from "../infrastructure/list-expenses.query.port.js";
import type { ListRepaymentsQueryPort } from "../infrastructure/list-repayments.query.port.js";

export async function getMyBalance(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listExpensesQuery: ListExpensesQueryPort;
    listRepaymentsQuery: ListRepaymentsQueryPort;
    getOrganizationCurrencyQuery: GetOrganizationCurrencyQueryPort;
  },
  input: { scope: OrganizationScope; userId: string },
) {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Expense", action: "read" });

  const [expenses, repayments, currency] = await Promise.all([
    deps.listExpensesQuery(deps.db, input.scope, { eventId: null }),
    deps.listRepaymentsQuery(deps.db, input.scope),
    deps.getOrganizationCurrencyQuery(deps.db, input.scope),
  ]);
  const amountMinor =
    computeBalances({ expenses, repayments }).find((balance) => balance.userId === input.userId)
      ?.amountMinor ?? 0;
  return { amountMinor, currency };
}
