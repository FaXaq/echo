import { describe, expect, it } from "vitest";
import { createSystemOrganizationScope } from "@echo/modules/shared/domain";
import { checkCurrencyChange } from "./check-currency-change.js";
import { makeFakeDb } from "./test-fixtures.js";

const scope = createSystemOrganizationScope("org-1");

function makeDeps(state: { currency: string; hasEntries: boolean }) {
  return {
    db: makeFakeDb(),
    getOrganizationCurrencyQuery: async () => state.currency,
    hasLedgerEntriesQuery: async () => state.hasEntries,
  };
}

describe("checkCurrencyChange", () => {
  it("rejects an unsupported currency", async () => {
    const verdict = await checkCurrencyChange(makeDeps({ currency: "EUR", hasEntries: false }), {
      scope,
      currency: "XXXX",
    });
    expect(verdict).toBe("unsupported");
  });

  it("allows a change while the ledger is empty", async () => {
    const verdict = await checkCurrencyChange(makeDeps({ currency: "EUR", hasEntries: false }), {
      scope,
      currency: "USD",
    });
    expect(verdict).toBe("ok");
  });

  it("locks a real change once the ledger has entries", async () => {
    const verdict = await checkCurrencyChange(makeDeps({ currency: "EUR", hasEntries: true }), {
      scope,
      currency: "USD",
    });
    expect(verdict).toBe("locked");
  });

  it("allows re-submitting the current currency even when the ledger has entries", async () => {
    const verdict = await checkCurrencyChange(makeDeps({ currency: "EUR", hasEntries: true }), {
      scope,
      currency: "EUR",
    });
    expect(verdict).toBe("ok");
  });
});
