import Decimal from "decimal.js";
import { MAX_AMOUNT_MINOR } from "./conversion.js";
import { invalidLedgerEntry } from "./errors.js";
import type { Share, SplitInput } from "./types.js";

export function apportion(input: {
  weights: { userId: string; weight: number }[];
  total: number;
  payerId: string;
}) {
  const weightSum = input.weights.reduce((sum, { weight }) => sum.plus(weight), new Decimal(0));
  const floored = input.weights.map(({ userId, weight }) => ({
    userId,
    amountMinor: new Decimal(weight).times(input.total).div(weightSum).floor().toNumber(),
  }));
  const leftover = input.total - floored.reduce((sum, share) => sum + share.amountMinor, 0);
  const absorberId = floored.some((share) => share.userId === input.payerId)
    ? input.payerId
    : floored[0]?.userId;

  return floored.map((share) =>
    share.userId === absorberId ? { ...share, amountMinor: share.amountMinor + leftover } : share,
  );
}

const isValidAmount = (amountMinor: number) =>
  Number.isInteger(amountMinor) && amountMinor > 0 && amountMinor <= MAX_AMOUNT_MINOR;

export function buildExpenseShares(input: {
  amountMinor: number;
  convertedAmountMinor: number;
  payerId: string;
  split: SplitInput;
}): Share[] {
  const { split, amountMinor, convertedAmountMinor, payerId } = input;

  if (!isValidAmount(amountMinor)) {
    throw invalidLedgerEntry("Expense", "Amount must be a positive whole number within the limit");
  }
  if (!isValidAmount(convertedAmountMinor)) {
    throw invalidLedgerEntry("Expense", "Converted amount must be positive and within the limit");
  }

  const userIds =
    split.mode === "equal" ? split.userIds : split.shares.map((share) => share.userId);
  if (userIds.length === 0) {
    throw invalidLedgerEntry("Expense", "An expense needs at least one share");
  }
  if (new Set(userIds).size !== userIds.length) {
    throw invalidLedgerEntry("Expense", "A member can only appear once in the split");
  }

  let ownShares: { userId: string; amountMinor: number }[];
  if (split.mode === "equal") {
    ownShares = apportion({
      weights: split.userIds.map((userId) => ({ userId, weight: 1 })),
      total: amountMinor,
      payerId,
    });
  } else {
    if (split.shares.some((share) => !isValidAmount(share.amountMinor))) {
      throw invalidLedgerEntry("Expense", "Every exact share must be a positive whole amount");
    }
    if (split.shares.reduce((sum, share) => sum + share.amountMinor, 0) !== amountMinor) {
      throw invalidLedgerEntry("Expense", "Exact shares must add up to the expense amount");
    }
    ownShares = split.shares;
  }

  const converted = new Map(
    apportion({
      weights: ownShares.map((share) => ({ userId: share.userId, weight: share.amountMinor })),
      total: convertedAmountMinor,
      payerId,
    }).map((share) => [share.userId, share.amountMinor]),
  );

  return ownShares.map((share) => ({
    userId: share.userId,
    amountMinor: share.amountMinor,
    convertedAmountMinor: converted.get(share.userId) ?? 0,
  }));
}
