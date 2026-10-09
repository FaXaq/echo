import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { render, screen } from "@/lib/test-utils";
import * as expenseResource from "@/services/resources/expense";
import { SuspendedOrganizationCurrency } from "./suspended-organization-currency";

function renderCurrency(settings: expenseResource.LedgerSettings) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    expenseResource.getLedgerSettingsQueryOptions({ organizationId: "org-1" }).queryKey,
    settings,
  );
  return render(
    <QueryClientProvider client={client}>
      <SuspendedOrganizationCurrency organizationId="org-1" />
    </QueryClientProvider>,
  );
}

describe("SuspendedOrganizationCurrency", () => {
  it("explains and disables the field once the ledger has entries", async () => {
    renderCurrency({ currency: "EUR", locked: true });

    expect(
      await screen.findByText(
        "The currency can't be changed once the project has expenses or repayments.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });

  it("keeps Save disabled until the currency actually changes", async () => {
    renderCurrency({ currency: "EUR", locked: false });

    expect(
      await screen.findByText("All balances and repayments are expressed in this currency."),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
  });
});
