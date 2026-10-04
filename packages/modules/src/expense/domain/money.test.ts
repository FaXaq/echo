import { describe, expect, it } from "vitest";
import { formatMajorAmount, parseMajorAmount } from "./money.js";

describe("parseMajorAmount", () => {
  it("converts a plain decimal to minor units", () => {
    expect(parseMajorAmount("12.50", 2)).toBe(1250);
    expect(parseMajorAmount("40", 2)).toBe(4000);
    expect(parseMajorAmount("0.1", 2)).toBe(10);
    expect(parseMajorAmount("1600", 0)).toBe(1600);
  });

  it("accepts a decimal comma and surrounding spaces", () => {
    expect(parseMajorAmount(" 12,5 ", 2)).toBe(1250);
  });

  it.each([
    ["12.505", 2],
    ["10.5", 0],
    ["abc", 2],
    ["", 2],
    ["-5", 2],
    ["1.2.3", 2],
  ])("rejects %j with exponent %i", (text, exponent) => {
    expect(parseMajorAmount(text, exponent)).toBeNull();
  });
});

describe("formatMajorAmount", () => {
  it("renders minor units as a plain decimal with the currency's decimals", () => {
    expect(formatMajorAmount(1250, 2)).toBe("12.50");
    expect(formatMajorAmount(1600, 0)).toBe("1600");
    expect(formatMajorAmount(5, 3)).toBe("0.005");
  });
});
