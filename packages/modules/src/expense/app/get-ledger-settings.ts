import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { GetOrganizationCurrencyQueryPort } from "../infrastructure/get-organization-currency.query.port.js";
import type { HasLedgerEntriesQueryPort } from "../infrastructure/has-ledger-entries.query.port.js";

export async function getLedgerSettings(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    getOrganizationCurrencyQuery: GetOrganizationCurrencyQueryPort;
    hasLedgerEntriesQuery: HasLedgerEntriesQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<{ currency: string; locked: boolean }> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Expense", action: "read" });

  const [currency, locked] = await Promise.all([
    deps.getOrganizationCurrencyQuery(deps.db, input.scope),
    deps.hasLedgerEntriesQuery(deps.db, input.scope),
  ]);
  return { currency, locked };
}
