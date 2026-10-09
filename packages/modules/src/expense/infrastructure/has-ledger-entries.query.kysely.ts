import type { HasLedgerEntriesQueryPortFactory } from "./has-ledger-entries.query.port.js";

export const hasLedgerEntriesQueryFactory: HasLedgerEntriesQueryPortFactory =
  () => async (db, scope) => {
    const orgId = scope.organizationId;
    const row = await db
      .selectNoFrom((eb) =>
        eb
          .or([
            eb.exists(
              eb
                .selectFrom("expense")
                .select(eb.lit(1).as("one"))
                .where("organization_id", "=", orgId),
            ),
            eb.exists(
              eb
                .selectFrom("repayment")
                .select(eb.lit(1).as("one"))
                .where("organization_id", "=", orgId),
            ),
          ])
          .as("has_entries"),
      )
      .executeTakeFirst();
    return Boolean(row?.has_entries);
  };
