import type { Balance, SuggestedRepayment } from "./types.js";

export function computeBalances(input: {
  expenses: {
    payerId: string;
    convertedAmountMinor: number;
    shares: { userId: string; convertedAmountMinor: number }[];
  }[];
  repayments: { fromUserId: string; toUserId: string; amountMinor: number }[];
}): Balance[] {
  const totals = new Map<string, number>();
  const add = (userId: string, amountMinor: number) =>
    totals.set(userId, (totals.get(userId) ?? 0) + amountMinor);

  for (const expense of input.expenses) {
    add(expense.payerId, expense.convertedAmountMinor);
    for (const share of expense.shares) add(share.userId, -share.convertedAmountMinor);
  }
  for (const repayment of input.repayments) {
    add(repayment.fromUserId, repayment.amountMinor);
    add(repayment.toUserId, -repayment.amountMinor);
  }

  return [...totals]
    .map(([userId, amountMinor]) => ({ userId, amountMinor }))
    .sort((a, b) => a.userId.localeCompare(b.userId));
}

const largestFirst = (a: Balance, b: Balance) =>
  b.amountMinor - a.amountMinor || a.userId.localeCompare(b.userId);

export function suggestRepayments(balances: Balance[]) {
  const creditors = balances.filter((b) => b.amountMinor > 0).map((b) => ({ ...b }));
  const debtors = balances
    .filter((b) => b.amountMinor < 0)
    .map((b) => ({ userId: b.userId, amountMinor: -b.amountMinor }));
  creditors.sort(largestFirst);
  debtors.sort(largestFirst);

  const suggestions: SuggestedRepayment[] = [];
  let creditorIndex = 0;
  let debtorIndex = 0;
  while (creditorIndex < creditors.length && debtorIndex < debtors.length) {
    const creditor = creditors[creditorIndex];
    const debtor = debtors[debtorIndex];
    if (!creditor || !debtor) break;

    const amountMinor = Math.min(creditor.amountMinor, debtor.amountMinor);
    suggestions.push({ fromUserId: debtor.userId, toUserId: creditor.userId, amountMinor });
    creditor.amountMinor -= amountMinor;
    debtor.amountMinor -= amountMinor;
    if (creditor.amountMinor === 0) creditorIndex++;
    if (debtor.amountMinor === 0) debtorIndex++;
  }
  return suggestions;
}
