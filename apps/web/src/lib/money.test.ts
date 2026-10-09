import { describe, expect, it } from "vitest";
import { formatMoney } from "./money";

describe("formatMoney", () => {
  it("formats minor units in the currency's own precision", () => {
    expect(formatMoney(1250, "EUR", "en")).toBe("€12.50");
    expect(formatMoney(1600, "JPY", "en")).toBe("¥1,600");
    expect(formatMoney(-2000, "EUR", "en")).toBe("-€20.00");
  });

  it("follows the locale's separators", () => {
    expect(formatMoney(1250, "EUR", "fr")).toContain("12,50");
  });
});
