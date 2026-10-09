import { describe, expect, it } from "vitest";
import { DataValidationFailedError, ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { ExpenseDraft } from "./prepare-expense.js";
import type { InsertExpenseCommandPort } from "../infrastructure/insert-expense.command.port.js";
import { createExpense } from "./create-expense.js";
import {
  deniedPermissionChecks,
  makeFakeCalendarEvent,
  makeFakeDb,
  makeFakeExpense,
  makeFakePermissionChecks,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

const draft: ExpenseDraft = {
  title: "Rehearsal room",
  description: null,
  paidOn: "2026-10-01",
  amountMinor: 4000,
  currency: "EUR",
  exchangeRate: null,
  payerId: "marie",
  eventId: null,
  split: { mode: "equal", userIds: ["marie", "paul"] },
};

function makeDeps(overrides: Partial<Parameters<typeof createExpense>[0]> = {}) {
  const inserted: Parameters<InsertExpenseCommandPort>[2][] = [];
  const deps = {
    db: makeFakeDb(),
    ...makeFakePermissionChecks(),
    insertExpenseCommand: (async (_db, _scope, input) => {
      inserted.push(input);
      return makeFakeExpense({ title: input.title });
    }) satisfies InsertExpenseCommandPort,
    getOrganizationCurrencyQuery: async () => "EUR",
    listOrganizationMemberIdsQuery: async () => ["marie", "paul"],
    getCalendarEventByIdQuery: async () => undefined,
    ...overrides,
  };
  return { deps, inserted };
}

describe("createExpense", () => {
  it("rejects a member without expense:create permission", async () => {
    const { deps } = makeDeps(deniedPermissionChecks);

    await expect(createExpense(deps, { scope, userId: "marie", draft })).rejects.toBeInstanceOf(
      ForbiddenError,
    );
  });

  it("stores a same-currency expense with no rate, ignoring a stray one", async () => {
    const { deps, inserted } = makeDeps();

    await createExpense(deps, { scope, userId: "marie", draft: { ...draft, exchangeRate: "1.5" } });

    expect(inserted).toEqual([
      {
        id: expect.any(String),
        userId: "marie",
        title: "Rehearsal room",
        description: null,
        paidOn: "2026-10-01",
        amountMinor: 4000,
        currency: "EUR",
        exchangeRate: null,
        convertedAmountMinor: 4000,
        splitMode: "equal",
        payerId: "marie",
        eventId: null,
        shares: [
          { userId: "marie", amountMinor: 2000, convertedAmountMinor: 2000 },
          { userId: "paul", amountMinor: 2000, convertedAmountMinor: 2000 },
        ],
      },
    ]);
  });

  it("freezes the rate and converted amounts for a foreign-currency expense", async () => {
    const { deps, inserted } = makeDeps();

    await createExpense(deps, {
      scope,
      userId: "paul",
      draft: {
        ...draft,
        amountMinor: 5000,
        currency: "USD",
        exchangeRate: "0.92",
        payerId: "paul",
      },
    });

    expect(inserted[0]).toMatchObject({
      currency: "USD",
      exchangeRate: "0.92",
      amountMinor: 5000,
      convertedAmountMinor: 4600,
      shares: [
        { userId: "marie", amountMinor: 2500, convertedAmountMinor: 2300 },
        { userId: "paul", amountMinor: 2500, convertedAmountMinor: 2300 },
      ],
    });
  });

  it("rejects a foreign-currency expense without an exchange rate", async () => {
    const { deps } = makeDeps();

    await expect(
      createExpense(deps, { scope, userId: "marie", draft: { ...draft, currency: "USD" } }),
    ).rejects.toBeInstanceOf(DataValidationFailedError);
  });

  it("rejects an unsupported currency", async () => {
    const { deps } = makeDeps();

    await expect(
      createExpense(deps, {
        scope,
        userId: "marie",
        draft: { ...draft, currency: "XXXX", exchangeRate: "1" },
      }),
    ).rejects.toBeInstanceOf(DataValidationFailedError);
  });

  it("rejects a payer or share holder who is not a member", async () => {
    const { deps } = makeDeps({ listOrganizationMemberIdsQuery: async () => ["marie"] });

    await expect(createExpense(deps, { scope, userId: "marie", draft })).rejects.toBeInstanceOf(
      DataValidationFailedError,
    );
  });

  it("rejects an event that is not in the organization", async () => {
    const { deps } = makeDeps();

    await expect(
      createExpense(deps, { scope, userId: "marie", draft: { ...draft, eventId: "event-9" } }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("links an event that exists", async () => {
    const { deps, inserted } = makeDeps({
      getCalendarEventByIdQuery: async () => makeFakeCalendarEvent(),
    });

    await createExpense(deps, { scope, userId: "marie", draft: { ...draft, eventId: "event-1" } });

    expect(inserted[0]?.eventId).toBe("event-1");
  });
});
