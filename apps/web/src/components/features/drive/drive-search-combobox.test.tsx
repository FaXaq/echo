import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { i18n } from "@lingui/core";
import { afterEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen } from "@/lib/test-utils";
import { getDriveSearchQueryOptions } from "@/services/resources/drive";
import { DriveSearchCombobox } from "./drive-search-combobox";

vi.mock("@/services/api-client", () => ({ apiClient: { drive: {} } }));

afterEach(() => i18n.activate("en"));

function renderCombobox() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(
    getDriveSearchQueryOptions({ organizationId: "org-1", query: "gig" }).queryKey,
    {
      folders: [
        { location: { kind: "event", id: "event-1" }, name: "Gig", path: ["Events"] },
        { location: { kind: "song", id: "song-1" }, name: "Gig song", path: ["Songs"] },
      ],
      files: [],
    },
  );
  return render(
    <QueryClientProvider client={client}>
      <DriveSearchCombobox organizationId="org-1" onSelect={() => {}} />
    </QueryClientProvider>,
  );
}

describe("DriveSearchCombobox", () => {
  it("translates the Events and Songs head of a result location", async () => {
    i18n.activate("fr");
    const user = userEvent.setup();
    renderCombobox();

    await user.type(screen.getByRole("combobox"), "gig");

    expect(await screen.findByText("Événements")).toBeInTheDocument();
    expect(screen.getByText("Morceaux")).toBeInTheDocument();
    expect(screen.queryByText("Events")).not.toBeInTheDocument();
  });
});
