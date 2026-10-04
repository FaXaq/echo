import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { isSupportedCurrency } from "../domain/index.js";
import type { GetOrganizationCurrencyQueryPort } from "../infrastructure/get-organization-currency.query.port.js";
import type { HasLedgerEntriesQueryPort } from "../infrastructure/has-ledger-entries.query.port.js";

export async function checkCurrencyChange(
  deps: {
    db: KyselyDB;
    getOrganizationCurrencyQuery: GetOrganizationCurrencyQueryPort;
    hasLedgerEntriesQuery: HasLedgerEntriesQueryPort;
  },
  input: { scope: OrganizationScope; currency: string },
): Promise<"ok" | "unsupported" | "locked"> {
  if (!isSupportedCurrency(input.currency)) return "unsupported";

  const current = await deps.getOrganizationCurrencyQuery(deps.db, input.scope);
  if (input.currency === current) return "ok";

  const locked = await deps.hasLedgerEntriesQuery(deps.db, input.scope);
  return locked ? "locked" : "ok";
}
