import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DriveLocation } from "@echo/modules/drive/domain";
import { describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { render, screen, within } from "@/lib/test-utils";

const navigate = vi.fn();

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => navigate,
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#">{children}</a>,
}));
vi.mock("./drive-search-combobox", () => ({ DriveSearchCombobox: () => null }));
vi.mock("./suspended-drive-quota-bar", () => ({ SuspendedDriveQuotaBar: () => null }));

import { DriveExplorer } from "./drive-explorer";
import {
  getDriveLocationPathQueryKey,
  listFolderContentsQueryOptions,
  type FolderContents,
} from "@/services/resources/drive";
import { selfListOrganizations } from "@/services/resources/organization";

function renderExplorer(location: DriveLocation, contents: Partial<FolderContents> = {}) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  client.setQueryData(
    listFolderContentsQueryOptions({
      location,
      organizationId: "org-1",
      sort: "name",
      order: "asc",
    }).queryKey,
    { folders: [], systemFolders: [], files: [], ...contents },
  );
  client.setQueryData(getDriveLocationPathQueryKey({ location, organizationId: "org-1" }), []);
  client.setQueryData(selfListOrganizations().queryKey, [
    { id: "org-1", name: "Acme", slug: "acme", isPersonal: false, logoPattern: [] },
  ]);
  return render(
    <QueryClientProvider client={client}>
      <DriveExplorer
        organizationId="org-1"
        projectSlug="acme"
        location={location}
        sort="name"
        order="asc"
        onSortChange={() => {}}
      />
    </QueryClientProvider>,
  );
}

const folder = {
  id: "folder-1",
  organizationId: "org-1",
  parentFolderId: null,
  name: "Demos",
  createdAt: "2026-08-02T09:30:00.000Z",
  updatedAt: "2026-08-02T09:30:00.000Z",
};

describe("DriveExplorer system folders", () => {
  it("renders Events and Songs rows first at Drive root", async () => {
    renderExplorer(
      { kind: "root" },
      {
        folders: [folder],
        systemFolders: [
          { location: { kind: "events" }, name: "Events" },
          { location: { kind: "songs" }, name: "Songs" },
        ],
      },
    );

    await screen.findByText("Demos");
    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).queryByText(/^(Events|Songs|Demos)$/)?.textContent);
    expect(names).toEqual(["Events", "Songs", "Demos"]);
  });

  it("does not select or offer actions on system folder rows", async () => {
    renderExplorer(
      { kind: "root" },
      { systemFolders: [{ location: { kind: "events" }, name: "Events" }] },
    );

    const row = (await screen.findByText("Events")).closest("tr");
    expect(row).not.toBeNull();
    expect(within(row!).queryByRole("checkbox")).not.toBeInTheDocument();
    expect(within(row!).queryByRole("button")).not.toBeInTheDocument();
  });

  it("navigates to a system folder with the keyboard", async () => {
    const user = userEvent.setup();
    renderExplorer(
      { kind: "root" },
      { systemFolders: [{ location: { kind: "events" }, name: "Events" }] },
    );

    const row = (await screen.findByText("Events")).closest("tr");
    row?.focus();
    await user.keyboard("{Enter}");

    expect(navigate).toHaveBeenCalledWith({
      to: "/projects/$projectSlug/drive/events",
      params: { projectSlug: "acme" },
    });
  });

  it("does not offer upload or New folder in the Events root", async () => {
    renderExplorer({ kind: "events" });

    expect(await screen.findByText("No events yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /upload/i })).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Upload files")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new folder/i })).not.toBeInTheDocument();
  });

  it("renders an empty state in the Songs root", async () => {
    renderExplorer({ kind: "songs" });

    expect(await screen.findByText("No songs yet")).toBeInTheDocument();
  });

  it("hides New folder inside an event folder but keeps upload", async () => {
    renderExplorer({ kind: "event", id: "event-1" });

    expect(await screen.findByRole("button", { name: /upload/i })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /new folder/i })).not.toBeInTheDocument();
  });

  it("offers New folder and upload at Drive root", async () => {
    renderExplorer({ kind: "root" });

    expect(await screen.findByRole("button", { name: /new folder/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /upload/i })).toBeInTheDocument();
  });
});
