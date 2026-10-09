import { describe, expect, it } from "vitest";
import { DataValidationFailedError } from "@echo/errors";
import { apportion, buildExpenseShares } from "./split.js";

const sum = (values: number[]) => values.reduce((total, value) => total + value, 0);

describe("apportion", () => {
  it("gives the leftover units to the payer when they hold a share", () => {
    const result = apportion({
      weights: ["a", "b", "c"].map((userId) => ({ userId, weight: 1 })),
      total: 100,
      payerId: "b",
    });
    expect(result).toEqual([
      { userId: "a", amountMinor: 33 },
      { userId: "b", amountMinor: 34 },
      { userId: "c", amountMinor: 33 },
    ]);
  });

  it("gives the leftover to the first share holder when the payer holds none", () => {
    const result = apportion({
      weights: ["a", "b", "c"].map((userId) => ({ userId, weight: 1 })),
      total: 100,
      payerId: "p",
    });
    expect(result.map((share) => share.amountMinor)).toEqual([34, 33, 33]);
  });

  it("never makes a share negative when the total is smaller than the number of shares", () => {
    const result = apportion({
      weights: ["a", "b", "c", "d"].map((userId) => ({ userId, weight: 1 })),
      total: 2,
      payerId: "a",
    });
    expect(result.map((share) => share.amountMinor)).toEqual([2, 0, 0, 0]);
  });

  it("splits proportionally to weights", () => {
    const result = apportion({
      weights: [
        { userId: "a", weight: 60 },
        { userId: "b", weight: 40 },
      ],
      total: 50,
      payerId: "a",
    });
    expect(result.map((share) => share.amountMinor)).toEqual([30, 20]);
  });
});

describe("buildExpenseShares", () => {
  it("splits equally and makes the shares add up to the amount", () => {
    const shares = buildExpenseShares({
      amountMinor: 1001,
      convertedAmountMinor: 1001,
      payerId: "b",
      split: { mode: "equal", userIds: ["a", "b"] },
    });
    expect(shares).toEqual([
      { userId: "a", amountMinor: 500, convertedAmountMinor: 500 },
      { userId: "b", amountMinor: 501, convertedAmountMinor: 501 },
    ]);
  });

  it("gives the leftover to the first share holder when the payer holds no share", () => {
    const shares = buildExpenseShares({
      amountMinor: 100,
      convertedAmountMinor: 100,
      payerId: "p",
      split: { mode: "equal", userIds: ["a", "b", "c"] },
    });
    expect(shares).toEqual([
      { userId: "a", amountMinor: 34, convertedAmountMinor: 34 },
      { userId: "b", amountMinor: 33, convertedAmountMinor: 33 },
      { userId: "c", amountMinor: 33, convertedAmountMinor: 33 },
    ]);
  });

  it("keeps exact shares as given and converts them to add up to the converted total", () => {
    const shares = buildExpenseShares({
      amountMinor: 5000,
      convertedAmountMinor: 4600,
      payerId: "a",
      split: {
        mode: "exact",
        shares: [
          { userId: "a", amountMinor: 3333 },
          { userId: "b", amountMinor: 1667 },
        ],
      },
    });
    expect(shares.map((share) => share.amountMinor)).toEqual([3333, 1667]);
    expect(sum(shares.map((share) => share.convertedAmountMinor))).toBe(4600);
  });

  it("rejects exact shares that do not add up to the amount", () => {
    expect(() =>
      buildExpenseShares({
        amountMinor: 1000,
        convertedAmountMinor: 1000,
        payerId: "a",
        split: {
          mode: "exact",
          shares: [
            { userId: "a", amountMinor: 400 },
            { userId: "b", amountMinor: 500 },
          ],
        },
      }),
    ).toThrow(DataValidationFailedError);
  });

  it("rejects an empty split, a duplicated member and non-positive exact shares", () => {
    const base = { amountMinor: 1000, convertedAmountMinor: 1000, payerId: "a" };
    expect(() => buildExpenseShares({ ...base, split: { mode: "equal", userIds: [] } })).toThrow(
      DataValidationFailedError,
    );
    expect(() =>
      buildExpenseShares({ ...base, split: { mode: "equal", userIds: ["a", "a"] } }),
    ).toThrow(DataValidationFailedError);
    expect(() =>
      buildExpenseShares({
        ...base,
        split: {
          mode: "exact",
          shares: [
            { userId: "a", amountMinor: 1000 },
            { userId: "b", amountMinor: 0 },
          ],
        },
      }),
    ).toThrow(DataValidationFailedError);
  });

  it("rejects an amount that is not a positive whole number within the limit", () => {
    const split = { mode: "equal" as const, userIds: ["a"] };
    for (const amountMinor of [0, -5, 1.5, 2_000_000_001]) {
      expect(() =>
        buildExpenseShares({ amountMinor, convertedAmountMinor: 1000, payerId: "a", split }),
      ).toThrow(DataValidationFailedError);
    }
  });

  it("rejects a converted amount that rounds to zero or exceeds the limit", () => {
    const split = { mode: "equal" as const, userIds: ["a"] };
    for (const convertedAmountMinor of [0, 2_000_000_001]) {
      expect(() =>
        buildExpenseShares({ amountMinor: 1000, convertedAmountMinor, payerId: "a", split }),
      ).toThrow(DataValidationFailedError);
    }
  });

  it("rejects an equal split smaller than the number of people", () => {
    const base = { convertedAmountMinor: 3, payerId: "a" };
    const split = { mode: "equal" as const, userIds: ["a", "b", "c"] };
    expect(() => buildExpenseShares({ ...base, amountMinor: 2, split })).toThrow(
      DataValidationFailedError,
    );
    expect(
      buildExpenseShares({ ...base, amountMinor: 3, split }).map((share) => share.amountMinor),
    ).toEqual([1, 1, 1]);
  });

  it("rejects a conversion that leaves a share holder with a zero converted share", () => {
    expect(() =>
      buildExpenseShares({
        amountMinor: 1001,
        convertedAmountMinor: 5,
        payerId: "a",
        split: {
          mode: "exact",
          shares: [
            { userId: "a", amountMinor: 1000 },
            { userId: "b", amountMinor: 1 },
          ],
        },
      }),
    ).toThrow(DataValidationFailedError);
  });
});
