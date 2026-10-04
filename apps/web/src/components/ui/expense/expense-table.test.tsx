import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#">{children}</a>,
}));

import { render, screen } from "@/lib/test-utils";
import type { Expense } from "@/services/resources/expense";
import { ExpenseTable } from "./expense-table";

const expense: Expense = {
  id: "expense-1",
  organizationId: "org-1",
  createdBy: "marie",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: null,
  title: "Rehearsal room",
  description: "Two hours",
  paidOn: "2026-03-10",
  amountMinor: 4000,
  currency: "EUR",
  exchangeRate: null,
  convertedAmountMinor: 4000,
  splitMode: "equal",
  payerId: "marie",
  eventId: "event-1",
  shares: [],
};

const participants = [{ userId: "marie", name: "Marie" }];
const events = [{ id: "event-1", title: "Spring gig", startDate: "2026-03-10T18:00:00" }];

describe("ExpenseTable", () => {
  it("shows an empty state when there are no expenses", () => {
    render(
      <ExpenseTable
        expenses={[]}
        events={events}
        participants={participants}
        organizationCurrency="EUR"
        projectSlug="acme-inc"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("No expenses yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders a row with its details and linked event", () => {
    render(
      <ExpenseTable
        expenses={[expense]}
        events={events}
        participants={participants}
        organizationCurrency="EUR"
        projectSlug="acme-inc"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("Rehearsal room")).toBeInTheDocument();
    expect(screen.getByText("Two hours")).toBeInTheDocument();
    expect(screen.getByText("Spring gig")).toBeInTheDocument();
    expect(screen.getByText("Marie")).toBeInTheDocument();
    expect(screen.getByText("€40.00")).toBeInTheDocument();
  });
});
