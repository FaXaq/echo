import { describe, expect, it } from "vitest";
import { currencyExponent, isSupportedCurrency } from "./currency.js";

describe("currencyExponent", () => {
  it("reads the ISO 4217 minor-unit exponent", () => {
    expect(currencyExponent("EUR")).toBe(2);
    expect(currencyExponent("JPY")).toBe(0);
    expect(currencyExponent("KWD")).toBe(3);
  });
});

describe("isSupportedCurrency", () => {
  it("accepts real ISO codes and rejects everything else", () => {
    expect(isSupportedCurrency("EUR")).toBe(true);
    expect(isSupportedCurrency("USD")).toBe(true);
    expect(isSupportedCurrency("eur")).toBe(false);
    expect(isSupportedCurrency("EURO")).toBe(false);
    expect(isSupportedCurrency("")).toBe(false);
  });
});
