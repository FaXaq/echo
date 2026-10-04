import Decimal from "decimal.js";
import { invalidLedgerEntry } from "./errors.js";

export const MAX_AMOUNT_MINOR = 2_000_000_000;

export function parseExchangeRate(rate: string) {
  if (!/^\d+(\.\d{1,8})?$/.test(rate) || new Decimal(rate).lte(0)) {
    throw invalidLedgerEntry(
      "Expense",
      "Exchange rate must be a positive number with at most 8 decimals",
    );
  }
  return rate;
}

export function convertAmount(input: {
  amountMinor: number;
  fromExponent: number;
  toExponent: number;
  rate: string;
}) {
  return new Decimal(input.amountMinor)
    .div(new Decimal(10).pow(input.fromExponent))
    .times(input.rate)
    .times(new Decimal(10).pow(input.toExponent))
    .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
    .toNumber();
}
