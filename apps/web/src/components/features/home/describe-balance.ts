import { match } from "ts-pattern";

export type BalanceKind = "owe" | "owed" | "settled";

// amountMinor follows computeBalances: positive = the member is owed money, negative = they owe.
export function describeBalance(amountMinor: number): { kind: BalanceKind; amountMinor: number } {
  return match<number, { kind: BalanceKind; amountMinor: number }>(amountMinor)
    .when(
      (n) => n > 0,
      () => ({ kind: "owed", amountMinor }),
    )
    .when(
      (n) => n < 0,
      () => ({ kind: "owe", amountMinor }),
    )
    .otherwise(() => ({ kind: "settled", amountMinor }));
}
