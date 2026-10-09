import { describe, expect, it } from "vitest";
import { DataValidationFailedError } from "@echo/errors";
import { convertAmount, parseExchangeRate } from "./conversion.js";

describe("convertAmount", () => {
  it("converts between currencies with different exponents", () => {
    expect(convertAmount({ amountMinor: 1000, fromExponent: 2, toExponent: 0, rate: "160" })).toBe(
      1600,
    );
    expect(convertAmount({ amountMinor: 5000, fromExponent: 2, toExponent: 2, rate: "0.92" })).toBe(
      4600,
    );
  });

  it("rounds half up to the nearest minor unit", () => {
    expect(convertAmount({ amountMinor: 1, fromExponent: 2, toExponent: 2, rate: "0.5" })).toBe(1);
    expect(convertAmount({ amountMinor: 1, fromExponent: 2, toExponent: 2, rate: "0.4" })).toBe(0);
  });
});

describe("parseExchangeRate", () => {
  it("accepts a positive decimal with at most 8 decimals", () => {
    expect(parseExchangeRate("0.92")).toBe("0.92");
    expect(parseExchangeRate("1.12345678")).toBe("1.12345678");
  });

  it.each(["0", "0.0", "-1", "abc", "1,5", "", "1.123456789"])("rejects %j", (rate) => {
    expect(() => parseExchangeRate(rate)).toThrow(DataValidationFailedError);
  });
});
