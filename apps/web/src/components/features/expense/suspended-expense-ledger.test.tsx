import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/lib/test-utils";
import * as calendarResource from "@/services/resources/calendar";
import * as expenseResource from "@/services/resources/expense";

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useParams: () => ({ projectSlug: "acme-inc" }),
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#">{children}</a>,
}));

import { SuspendedExpenseLedger } from "./suspended-expense-ledger";

const summary: expenseResource.LedgerSummary = {
  currency: "EUR",
  participants: [
    { userId: "marie", name: "Marie", image: null, isMember: true },
    { userId: "paul", name: "Paul", image: null, isMember: false },
  ],
  balances: [
    { userId: "marie", amountMinor: 2000 },
    { userId: "paul", amountMinor: -2000 },
  ],
  suggestedRepayments: [{ fromUserId: "paul", toUserId: "marie", amountMinor: 2000 }],
};

const expense: expenseResource.Expense = {
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

function renderLedger(data: {
  summary: expenseResource.LedgerSummary;
  expenses: expenseResource.Expense[];
  repayments: expenseResource.Repayment[];
}) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const opts = { organizationId: "org-1" };
  client.setQueryData(expenseResource.getLedgerSummaryQueryOptions(opts).queryKey, data.summary);
  client.setQueryData(expenseResource.getExpensesQueryOptions(opts).queryKey, data.expenses);
  client.setQueryData(expenseResource.getRepaymentsQueryOptions(opts).queryKey, data.repayments);
  client.setQueryData(calendarResource.getEventsQueryOptions(opts).queryKey, []);

  return render(
    <QueryClientProvider client={client}>
      <SuspendedExpenseLedger organizationId="org-1" currentUserId="marie" />
    </QueryClientProvider>,
  );
}

describe("SuspendedExpenseLedger", () => {
  it("shows balances, the suggested repayment and the expense list", async () => {
    renderLedger({ summary, expenses: [expense], repayments: [] });

    expect(await screen.findAllByText("+ €20.00")).toHaveLength(2);
    expect(screen.getByText("- €20.00")).toBeInTheDocument();
    expect(screen.getByText("Former member")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Record" }).closest("li")).toHaveTextContent(
      "PaulMarie€20.00Record",
    );
    expect(screen.getByText("Rehearsal room")).toBeInTheDocument();
  });

  it("shows empty states when there is nothing yet", async () => {
    const user = userEvent.setup();
    renderLedger({
      summary: { ...summary, balances: [], suggestedRepayments: [] },
      expenses: [],
      repayments: [],
    });

    expect(await screen.findByText("No expenses yet")).toBeInTheDocument();
    expect(screen.getByText("Everyone is settled up.")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: "Repayments" }));

    expect(screen.getByText("No repayments yet")).toBeInTheDocument();
  });

  it("opens the new-expense dialog", async () => {
    const user = userEvent.setup();
    renderLedger({ summary, expenses: [], repayments: [] });

    await user.click((await screen.findAllByRole("button", { name: "New expense" }))[0]);

    expect(screen.getByRole("heading", { name: "New expense" })).toBeInTheDocument();
  });

  it("pre-fills a repayment from a suggestion", async () => {
    const user = userEvent.setup();
    renderLedger({ summary, expenses: [], repayments: [] });

    await user.click(await screen.findByRole("button", { name: "Record" }));

    expect(screen.getByRole("heading", { name: "New repayment" })).toBeInTheDocument();
    expect(screen.getByLabelText("Amount (EUR)")).toHaveValue("20.00");
  });
});
