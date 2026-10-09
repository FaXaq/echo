import { describe, expect, it } from "vitest";
import { render, screen } from "@/lib/test-utils";
import { BalanceList } from "./balance-list";

describe("BalanceList", () => {
  it("shows who is owed, who owes, who is settled, and flags former members", () => {
    render(
      <BalanceList
        currency="EUR"
        entries={[
          { userId: "marie", name: "Marie", isMember: true, amountMinor: 2000 },
          { userId: "paul", name: "Paul", isMember: false, amountMinor: -2000 },
          { userId: "lea", name: "Lea", isMember: true, amountMinor: 0 },
        ]}
      />,
    );

    expect(screen.getByText("+ €20.00")).toBeInTheDocument();
    expect(screen.getByText("- €20.00")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.getByText("Former member")).toBeInTheDocument();
  });
});
