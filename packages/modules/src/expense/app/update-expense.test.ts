import { describe, expect, it } from "vitest";
import { DataValidationFailedError, ForbiddenError, NotFoundError } from "@echo/errors";
import { createOrganizationScope } from "@echo/modules/shared/domain";
import type { ExpenseDraft } from "./prepare-expense.js";
import type { UpdateExpenseCommandPort } from "../infrastructure/update-expense.command.port.js";
import { updateExpense } from "./update-expense.js";
import {
  deniedPermissionChecks,
  makeFakeDb,
  makeFakeExpense,
  makeFakePermissionChecks,
} from "./test-fixtures.js";

const scope = createOrganizationScope("org-1");

const draft: ExpenseDraft = {
  title: "Rehearsal room (fixed typo)",
  description: null,
  paidOn: "2026-10-01",
  amountMinor: 4000,
  currency: "EUR",
  exchangeRate: null,
  payerId: "marie",
  eventId: null,
  split: { mode: "equal", userIds: ["marie", "paul"] },
};

function makeDeps(overrides: Partial<Parameters<typeof updateExpense>[0]> = {}) {
  const updated: Parameters<UpdateExpenseCommandPort>[2][] = [];
  const deps = {
    db: makeFakeDb(),
    ...makeFakePermissionChecks(),
    getExpenseByIdQuery: async () => makeFakeExpense(),
    updateExpenseCommand: (async (_db, _scope, input) => {
      updated.push(input);
      return makeFakeExpense({ title: input.title });
    }) satisfies UpdateExpenseCommandPort,
    getOrganizationCurrencyQuery: async () => "EUR",
    listOrganizationMemberIdsQuery: async () => ["marie"],
    getCalendarEventByIdQuery: async () => undefined,
    ...overrides,
  };
  return { deps, updated };
}

describe("updateExpense", () => {
  it("rejects a member without expense:update permission", async () => {
    const { deps } = makeDeps(deniedPermissionChecks);

    await expect(
      updateExpense(deps, { scope, userId: "marie", id: "expense-1", draft }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("is not found when the expense does not exist", async () => {
    const { deps } = makeDeps({ getExpenseByIdQuery: async () => undefined });

    await expect(
      updateExpense(deps, { scope, userId: "marie", id: "nope", draft }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("lets a former member stay on the expense they were already on", async () => {
    const { deps, updated } = makeDeps();

    await updateExpense(deps, { scope, userId: "marie", id: "expense-1", draft });

    expect(updated[0]).toMatchObject({ id: "expense-1", title: "Rehearsal room (fixed typo)" });
  });

  it("still rejects adding a different non-member", async () => {
    const { deps } = makeDeps();

    await expect(
      updateExpense(deps, {
        scope,
        userId: "marie",
        id: "expense-1",
        draft: { ...draft, split: { mode: "equal", userIds: ["marie", "paul", "stranger"] } },
      }),
    ).rejects.toBeInstanceOf(DataValidationFailedError);
  });
});
