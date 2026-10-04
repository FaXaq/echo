import { describe, expect, it } from "vitest";
import { computeBalances, suggestRepayments } from "./balances.js";

const marieAndPaulSplit = {
  payerId: "marie",
  convertedAmountMinor: 4000,
  shares: [
    { userId: "marie", convertedAmountMinor: 2000 },
    { userId: "paul", convertedAmountMinor: 2000 },
  ],
};

describe("computeBalances", () => {
  it("credits the payer and debits share holders", () => {
    expect(computeBalances({ expenses: [marieAndPaulSplit], repayments: [] })).toEqual([
      { userId: "marie", amountMinor: 2000 },
      { userId: "paul", amountMinor: -2000 },
    ]);
  });

  it("brings both balances to zero when the debtor repays the creditor", () => {
    const balances = computeBalances({
      expenses: [marieAndPaulSplit],
      repayments: [{ fromUserId: "paul", toUserId: "marie", amountMinor: 2000 }],
    });
    expect(balances).toEqual([
      { userId: "marie", amountMinor: 0 },
      { userId: "paul", amountMinor: 0 },
    ]);
  });

  it("flips the debt when a repayment exceeds what was owed", () => {
    const balances = computeBalances({
      expenses: [marieAndPaulSplit],
      repayments: [{ fromUserId: "paul", toUserId: "marie", amountMinor: 3000 }],
    });
    expect(balances).toEqual([
      { userId: "marie", amountMinor: -1000 },
      { userId: "paul", amountMinor: 1000 },
    ]);
  });

  it("always sums to zero across several expenses", () => {
    const balances = computeBalances({
      expenses: [
        marieAndPaulSplit,
        {
          payerId: "lea",
          convertedAmountMinor: 999,
          shares: [
            { userId: "marie", convertedAmountMinor: 333 },
            { userId: "paul", convertedAmountMinor: 333 },
            { userId: "lea", convertedAmountMinor: 333 },
          ],
        },
      ],
      repayments: [],
    });
    expect(balances.reduce((total, balance) => total + balance.amountMinor, 0)).toBe(0);
  });
});

describe("suggestRepayments", () => {
  it("settles everyone with the fewest greedy transfers", () => {
    expect(
      suggestRepayments([
        { userId: "a", amountMinor: 30 },
        { userId: "b", amountMinor: -10 },
        { userId: "c", amountMinor: -20 },
      ]),
    ).toEqual([
      { fromUserId: "c", toUserId: "a", amountMinor: 20 },
      { fromUserId: "b", toUserId: "a", amountMinor: 10 },
    ]);
  });

  it("suggests nothing when everyone is settled", () => {
    expect(suggestRepayments([{ userId: "a", amountMinor: 0 }])).toEqual([]);
  });

  it("does not mutate its input", () => {
    const balances = [
      { userId: "a", amountMinor: 10 },
      { userId: "b", amountMinor: -10 },
    ];
    suggestRepayments(balances);
    expect(balances).toEqual([
      { userId: "a", amountMinor: 10 },
      { userId: "b", amountMinor: -10 },
    ]);
  });
});
