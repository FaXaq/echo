# Expenses carry their own currency with a frozen rate; Balances are derived, never stored

An Expense may be in any currency; it records its amount in that currency plus an Exchange Rate to the Organization Currency, typed in by the member and frozen on the Expense. Balances are always derived from the Expense/Repayment history in the Organization Currency, with no stored balance table. Freezing the rate at entry means a past debt can never drift (converting at read time with a live rate would), and deriving Balances means there is nothing to keep in sync or reconcile after an edit — a band's ledger is small enough that summing it is not a performance concern. The Organization Currency is locked once the ledger has entries, since every stored converted amount is only meaningful against one base.

## Considered Options

- **Single currency per Organization, no conversion.** Simplest, and was the initial design. Rejected: bands touring or buying abroad pay in other currencies and would be forced to convert by hand outside the app.
- **Per-currency Balances, never converted** ("Paul is owed $50, Marie €40"). Rejected: users want one number to pay, and it makes suggested Repayments awkward.
- **Convert at read time with the current rate.** Rejected: old debts silently change over time.
- **Stored per-member Balances.** Rejected: no driver (performance isn't a concern at this size; history/snapshots would be a separate Settlement concept), and it adds a cache to keep correct across every edit.

## Consequences

- Repayments are always in the Organization Currency; there is no per-Repayment currency or rate.
- Editing an Expense's rate retroactively changes Balances. That is accepted: any member may freely edit any Expense, and the ledger is not an audit trail.

## Future: fetched rates

Rates are typed in manually for now. A later iteration could pre-fill the rate from an exchange-rate provider via a new `packages/adapters/fx/` adapter (port + implementation, same shape as `geocoding`), keeping the field editable and the rate still frozen on the Expense once saved. Deferred because it adds an external dependency and a failure mode (provider outage) for something manual entry already covers, and no provider has been chosen.
