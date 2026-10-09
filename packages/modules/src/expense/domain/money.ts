import Decimal from "decimal.js";

export function parseMajorAmount(text: string, exponent: number) {
  const normalized = text.trim().replace(",", ".");
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;

  const amount = new Decimal(normalized);
  if (amount.decimalPlaces() > exponent) return null;
  return amount.times(new Decimal(10).pow(exponent)).toNumber();
}

export function formatMajorAmount(amountMinor: number, exponent: number) {
  return new Decimal(amountMinor).div(new Decimal(10).pow(exponent)).toFixed(exponent);
}
