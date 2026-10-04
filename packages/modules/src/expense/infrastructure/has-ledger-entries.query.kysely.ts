import { sql } from "kysely";
import type { HasLedgerEntriesQueryPortFactory } from "./has-ledger-entries.query.port.js";

export const hasLedgerEntriesQueryFactory: HasLedgerEntriesQueryPortFactory =
  () => async (db, scope) => {
    const orgId = scope.organizationId;
    const { rows } = await sql<{ has_entries: boolean }>`
      select (
        exists (select 1 from expense where organization_id = ${orgId})
        or exists (select 1 from repayment where organization_id = ${orgId})
      ) as has_entries
    `.execute(db);
    return rows[0]?.has_entries ?? false;
  };
