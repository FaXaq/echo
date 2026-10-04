import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/lib/test-utils";
import type { Expense } from "@/services/resources/expense";
import { ExpenseDialog } from "./expense-dialog";

const participants = [
  { userId: "marie", name: "Marie", isMember: true },
  { userId: "paul", name: "Paul", isMember: false },
];

function makeExpense(): Expense {
  return {
    id: "expense-1",
    organizationId: "org-1",
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
    createdBy: "marie",
    createdAt: "2026-10-01T10:00:00.000Z",
    updatedAt: null,
    shares: [
      { userId: "marie", amountMinor: 2000, convertedAmountMinor: 2000 },
      { userId: "paul", amountMinor: 2000, convertedAmountMinor: 2000 },
    ],
  };
}

function renderDialog(state: Parameters<typeof ExpenseDialog>[0]["state"], onSubmit = vi.fn()) {
  render(
    <ExpenseDialog
      state={state}
      participants={participants}
      events={[]}
      organizationCurrency="EUR"
      currentUserId="marie"
      onOpenChange={vi.fn()}
      onSubmit={onSubmit}
    />,
  );
  return onSubmit;
}

describe("ExpenseDialog", () => {
  it("submits a new expense in minor units, defaulting the payer to the current user", async () => {
    const user = userEvent.setup();
    const onSubmit = renderDialog({ mode: "create" });

    await user.type(screen.getByLabelText("Title"), "Strings");
    await user.type(screen.getByLabelText("Amount"), "12,50");
    await user.click(screen.getByRole("button", { name: "Create expense" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject({
      title: "Strings",
      amountMinor: 1250,
      currency: "EUR",
      payerId: "marie",
      split: { mode: "equal", userIds: ["marie"] },
    });
  });

  it("shows an error and does not submit without a title", async () => {
    const user = userEvent.setup();
    const onSubmit = renderDialog({ mode: "create" });

    await user.type(screen.getByLabelText("Amount"), "10");
    await user.click(screen.getByRole("button", { name: "Create expense" }));

    expect(await screen.findByText("Title is required")).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("keeps a former member visible when editing an expense they were on", async () => {
    renderDialog({ mode: "edit", expense: makeExpense() });

    expect(await screen.findByRole("checkbox", { name: "Paul" })).toBeInTheDocument();
  });
});
