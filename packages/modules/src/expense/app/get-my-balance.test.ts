import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { getMyBalance } from "./get-my-balance.js";
import {
  deniedPermissionChecks,
  makeFakeDb,
  makeFakeExpense,
  makeFakePermissionChecks,
  makeFakeRepayment,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

function makeDeps(overrides: Partial<Parameters<typeof getMyBalance>[0]> = {}) {
  return {
    db: makeFakeDb(),
    ...makeFakePermissionChecks(),
    listExpensesQuery: async () => [makeFakeExpense()],
    listRepaymentsQuery: async () => [makeFakeRepayment({ amountMinor: 500 })],
    getOrganizationCurrencyQuery: async () => "EUR",
    ...overrides,
  };
}

describe("getMyBalance", () => {
  it("returns the requesting member's balance in the organization currency", async () => {
    await expect(getMyBalance(makeDeps(), { scope, userId: "paul" })).resolves.toEqual({
      amountMinor: -1500,
      currency: "EUR",
    });
  });

  it("returns zero for a member with no ledger entries", async () => {
    await expect(getMyBalance(makeDeps(), { scope, userId: "lea" })).resolves.toEqual({
      amountMinor: 0,
      currency: "EUR",
    });
  });

  it("rejects members who cannot read expenses", async () => {
    await expect(
      getMyBalance(makeDeps(deniedPermissionChecks), { scope, userId: "paul" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });
});
