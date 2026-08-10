import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { OrganizationField } from "./organization-field";
import * as organizationResource from "@/services/resources/organization";

const sampleOrganizations = [
  { id: "org-1", name: "Acme Inc" },
  { id: "org-2", name: "Beta Co" },
];

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("OrganizationField", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows a skeleton while loading, then options; selecting one calls onChange", async () => {
    let resolveList: (organizations: typeof sampleOrganizations) => void = () => {};
    vi.spyOn(organizationResource, "selfListOrganizations").mockReturnValue({
      queryKey: ["organization", "selfList"],
      queryFn: () =>
        new Promise((resolve) => {
          resolveList = resolve;
        }),
    } as never);

    const user = userEvent.setup();
    const onChange = vi.fn();
    renderWithClient(<OrganizationField value="org-1" onChange={onChange} />);

    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();

    resolveList(sampleOrganizations);

    const trigger = await screen.findByRole("combobox");
    await user.click(trigger);
    const option = await screen.findByRole("option", { name: "Beta Co" });
    await user.click(option);

    expect(onChange).toHaveBeenCalledWith("org-2");
  });

  it("shows the selected organization's name", async () => {
    vi.spyOn(organizationResource, "selfListOrganizations").mockReturnValue({
      queryKey: ["organization", "selfList"],
      queryFn: async () => sampleOrganizations,
    } as never);

    renderWithClient(<OrganizationField value="org-2" onChange={vi.fn()} />);

    const trigger = await screen.findByRole("combobox");
    expect(await within(trigger).findByText("Beta Co")).toBeInTheDocument();
  });
});
