import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/lib/test-utils";
import type { Repayment } from "@/services/resources/expense";
import { RepaymentTable } from "./repayment-table";

const repayment: Repayment = {
  id: "repayment-1",
  organizationId: "org-1",
  fromUserId: "paul",
  toUserId: "marie",
  amountMinor: 2000,
  paidOn: "2026-03-10",
  note: "Cash",
  createdBy: "paul",
  createdAt: "2026-03-10T10:00:00.000Z",
};

const participants = [
  { userId: "marie", name: "Marie" },
  { userId: "paul", name: "Paul" },
];

describe("RepaymentTable", () => {
  it("shows an empty state when there are no repayments", () => {
    render(
      <RepaymentTable
        repayments={[]}
        participants={participants}
        currency="EUR"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByText("No repayments yet")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("renders a row with names, note and amount", () => {
    render(
      <RepaymentTable
        repayments={[repayment]}
        participants={participants}
        currency="EUR"
        onEdit={vi.fn()}
        onDelete={vi.fn()}
      />,
    );

    expect(screen.getByRole("row", { name: /Paul Marie .* Cash €20\.00/ })).toBeInTheDocument();
  });
});
