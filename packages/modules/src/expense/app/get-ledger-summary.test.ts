import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import { getLedgerSummary } from "./get-ledger-summary.js";
import {
  deniedPermissionChecks,
  makeFakeDb,
  makeFakeExpense,
  makeFakePermissionChecks,
  makeFakeRepayment,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

const participants = [
  { userId: "lea", name: "Lea", image: null, isMember: true },
  { userId: "marie", name: "Marie", image: null, isMember: true },
  { userId: "paul", name: "Paul", image: null, isMember: false },
];

function makeDeps(overrides: Partial<Parameters<typeof getLedgerSummary>[0]> = {}) {
  return {
    db: makeFakeDb(),
    ...makeFakePermissionChecks(),
    listExpensesQuery: async () => [makeFakeExpense()],
    listRepaymentsQuery: async () => [],
    listLedgerParticipantsQuery: async () => participants,
    getOrganizationCurrencyQuery: async () => "EUR",
    ...overrides,
  };
}

describe("getLedgerSummary", () => {
  it("rejects a member without expense:read permission", async () => {
    await expect(
      getLedgerSummary(makeDeps(deniedPermissionChecks), { scope }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("lists a balance for every participant, including zero ones and former members", async () => {
    const summary = await getLedgerSummary(makeDeps(), { scope });

    expect(summary.currency).toBe("EUR");
    expect(summary.participants).toEqual(participants);
    expect(summary.balances).toEqual([
      { userId: "marie", amountMinor: 2000 },
      { userId: "lea", amountMinor: 0 },
      { userId: "paul", amountMinor: -2000 },
    ]);
    expect(summary.suggestedRepayments).toEqual([
      { fromUserId: "paul", toUserId: "marie", amountMinor: 2000 },
    ]);
  });

  it("settles to zero once the debtor's repayment is recorded", async () => {
    const summary = await getLedgerSummary(
      makeDeps({ listRepaymentsQuery: async () => [makeFakeRepayment()] }),
      { scope },
    );

    expect(summary.balances.every((balance) => balance.amountMinor === 0)).toBe(true);
    expect(summary.suggestedRepayments).toEqual([]);
  });

  it("always asks the query for the whole ledger, not one event", async () => {
    const seen: (string | null)[] = [];
    await getLedgerSummary(
      makeDeps({
        listExpensesQuery: async (_db, _scope, input) => {
          seen.push(input.eventId);
          return [];
        },
      }),
      { scope },
    );

    expect(seen).toEqual([null]);
  });
});
