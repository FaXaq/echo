import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { DriveLocation } from "@echo/modules/drive/domain";
import { beforeEach, describe, expect, it, vi } from "vitest";
import userEvent from "@testing-library/user-event";
import { TRPCClientError } from "@trpc/client";
import { render, screen, waitFor, within } from "@/lib/test-utils";

const navigate = vi.fn();
const addOccurrences = vi.fn();
const listFileOccurrences = vi.fn();
const removeOccurrence = vi.fn();
const previewFolderDelete = vi.fn();
const deleteFolder = vi.fn();
const toastAdd = vi.fn();

vi.mock("@/services/api-client", () => ({
  apiClient: {
    drive: {
      addOccurrences: { mutate: (input: unknown) => addOccurrences(input) },
      listFileOccurrences: { query: (input: unknown) => listFileOccurrences(input) },
      removeOccurrence: { mutate: (input: unknown) => removeOccurrence(input) },
      previewFolderDelete: { query: (input: unknown) => previewFolderDelete(input) },
      deleteFolder: { mutate: (input: unknown) => deleteFolder(input) },
    },
  },
}));
vi.mock("@/components/ui/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/ui/toast")>()),
  toast: { add: (options: unknown) => toastAdd(options) },
}));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  useNavigate: () => navigate,
  Link: ({ children }: { children?: React.ReactNode }) => <a href="#">{children}</a>,
}));
vi.mock("./drive-search-combobox", () => ({
  DriveSearchCombobox: () => <input aria-label="Search drive" />,
}));
vi.mock("./suspended-drive-quota-bar", () => ({ SuspendedDriveQuotaBar: () => null }));

import { DriveExplorer } from "./drive-explorer";
import { copyFiles, useDriveClipboard } from "./drive-clipboard";
import { renderHook } from "@testing-library/react";
import {
  getDriveLocationPathQueryKey,
  listFolderContentsQueryOptions,
  type FolderContents,
  type OrganizationFile,
} from "@/services/resources/drive";
import { selfListOrganizations } from "@/services/resources/organization";

function renderExplorer(
  location: DriveLocation,
  contents: Partial<FolderContents> = {},
  path: { name: string; location: DriveLocation }[] = [],
) {
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
  client.setQueryData(getDriveLocationPathQueryKey({ location, organizationId: "org-1" }), path);
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

function makeFile(id: string, filename: string): OrganizationFile {
  return {
    id,
    organizationId: "org-1",
    uploadedBy: "user-1",
    uploadedByName: "Jane Doe",
    kind: "document",
    mimeType: "application/pdf",
    sizeBytes: 1000,
    durationSeconds: null,
    width: null,
    height: null,
    hasThumbnail: false,
    filename,
    originalFilename: filename,
    s3Key: `key-${id}`,
    status: "uploaded",
    createdAt: "2026-08-02T09:30:00.000Z",
    updatedAt: "2026-08-02T09:30:00.000Z",
  };
}

async function selectRow(user: ReturnType<typeof userEvent.setup>, label: string) {
  const cell = (await screen.findByLabelText(label)).closest("td");
  if (!cell) throw new Error(`No cell for ${label}`);
  await user.click(cell);
}

beforeEach(() => {
  vi.clearAllMocks();
  renderHook(() => useDriveClipboard("org-1")).result.current.clear();
});

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

    await waitFor(() => expect(screen.getAllByRole("row")).toHaveLength(4));
    const names = screen
      .getAllByRole("row")
      .slice(1)
      .map((row) => within(row).queryByText(/^(Events|Songs|Demos)$/)?.textContent);
    expect(names).toEqual(["Events", "Songs", "Demos"]);
  });

  it("renders every Event system folder row without duplicate keys", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    renderExplorer(
      { kind: "events" },
      {
        systemFolders: [
          { location: { kind: "event", id: "event-1" }, name: "Gig A" },
          { location: { kind: "event", id: "event-2" }, name: "Gig B" },
        ],
      },
    );

    expect(await screen.findByText("Gig A")).toBeInTheDocument();
    expect(screen.getByText("Gig B")).toBeInTheDocument();
    expect(consoleError).not.toHaveBeenCalledWith(
      expect.stringContaining("same key"),
      expect.anything(),
    );
    consoleError.mockRestore();
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

describe("DriveExplorer copy and paste", () => {
  const files = [makeFile("f1", "a.pdf"), makeFile("f2", "b.pdf")];

  it("pastes copied files into another folder with the keyboard", async () => {
    const user = userEvent.setup();
    const source = renderExplorer({ kind: "root" }, { files });
    await selectRow(user, "Select a.pdf");
    await selectRow(user, "Select b.pdf");
    await user.keyboard("{Meta>}c{/Meta}");
    source.unmount();

    renderExplorer({ kind: "folder", id: "folder-1" });
    await user.click(await screen.findByText("This folder is empty"));
    await user.keyboard("{Meta>}v{/Meta}");

    await waitFor(() =>
      expect(addOccurrences).toHaveBeenCalledWith({
        fileIds: ["f1", "f2"],
        place: { kind: "folder", id: "folder-1" },
        organizationId: "org-1",
      }),
    );
    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Pasted 2 files", type: "success" }),
      ),
    );
  });

  it("clears the clipboard and says so when a copied file no longer exists", async () => {
    const user = userEvent.setup();
    copyFiles("org-1", ["f1"]);
    addOccurrences.mockRejectedValue(
      TRPCClientError.from({
        error: { message: "Not found", code: -32004, data: { code: "NOT_FOUND", httpStatus: 404 } },
      }),
    );
    renderExplorer({ kind: "folder", id: "folder-1" });
    await user.click(await screen.findByText("This folder is empty"));
    await user.keyboard("{Meta>}v{/Meta}");

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Some copied files no longer exist — copy them again",
          type: "error",
        }),
      ),
    );
    expect(renderHook(() => useDriveClipboard("org-1")).result.current.fileIds).toEqual([]);
  });

  it("keeps the clipboard and shows the generic toast on other paste errors", async () => {
    const user = userEvent.setup();
    copyFiles("org-1", ["f1"]);
    addOccurrences.mockRejectedValue(new Error("boom"));
    renderExplorer({ kind: "folder", id: "folder-1" });
    await user.click(await screen.findByText("This folder is empty"));
    await user.keyboard("{Meta>}v{/Meta}");

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Couldn't paste files", type: "error" }),
      ),
    );
    expect(renderHook(() => useDriveClipboard("org-1")).result.current.fileIds).toEqual(["f1"]);
  });

  it("ignores shortcuts typed in an input", async () => {
    const user = userEvent.setup();
    copyFiles("org-1", ["f1"]);
    renderExplorer({ kind: "root" });

    await user.click(await screen.findByLabelText("Search drive"));
    await user.keyboard("{Meta>}v{/Meta}");

    expect(addOccurrences).not.toHaveBeenCalled();
  });

  it("does not paste in the Events root", async () => {
    const user = userEvent.setup();
    copyFiles("org-1", ["f1"]);
    renderExplorer({ kind: "events" });

    await user.click(await screen.findByText("No events yet"));
    await user.keyboard("{Meta>}v{/Meta}");

    expect(addOccurrences).not.toHaveBeenCalled();
  });

  it("disables Copy when a folder is selected", async () => {
    const user = userEvent.setup();
    renderExplorer({ kind: "root" }, { folders: [folder], files });

    await selectRow(user, "Select Demos");
    await selectRow(user, "Select a.pdf");
    await user.click(screen.getByRole("button", { name: "Selection actions" }));

    expect(await screen.findByRole("menuitem", { name: "Copy" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("copies from the file context menu", async () => {
    const user = userEvent.setup();
    renderExplorer({ kind: "root" }, { files });

    await user.pointer({
      keys: "[MouseRight]",
      target: (await screen.findByText("a.pdf")).closest("tr")!,
    });
    await user.click(await screen.findByRole("menuitem", { name: "Copy" }));

    const { result } = renderHook(() => useDriveClipboard("org-1"));
    expect(result.current.fileIds).toEqual(["f1"]);
  });

  it("pastes into a folder row from its context menu", async () => {
    const user = userEvent.setup();
    copyFiles("org-1", ["f1"]);
    renderExplorer({ kind: "root" }, { folders: [folder] });

    await user.pointer({
      keys: "[MouseRight]",
      target: (await screen.findByText("Demos")).closest("tr")!,
    });
    await user.click(await screen.findByRole("menuitem", { name: "Paste into" }));

    await waitFor(() =>
      expect(addOccurrences).toHaveBeenCalledWith({
        fileIds: ["f1"],
        place: { kind: "folder", id: "folder-1" },
        organizationId: "org-1",
      }),
    );
  });

  it("pastes into an Event system folder row but offers nothing on the Events root row", async () => {
    const user = userEvent.setup();
    copyFiles("org-1", ["f1"]);
    renderExplorer(
      { kind: "events" },
      { systemFolders: [{ location: { kind: "event", id: "event-1" }, name: "Gig" }] },
    );

    await user.pointer({
      keys: "[MouseRight]",
      target: (await screen.findByText("Gig")).closest("tr")!,
    });
    await user.click(await screen.findByRole("menuitem", { name: "Paste into" }));

    await waitFor(() =>
      expect(addOccurrences).toHaveBeenCalledWith({
        fileIds: ["f1"],
        place: { kind: "event", id: "event-1" },
        organizationId: "org-1",
      }),
    );
  });

  it("offers no paste on the Events root row", async () => {
    const user = userEvent.setup();
    copyFiles("org-1", ["f1"]);
    renderExplorer(
      { kind: "root" },
      { systemFolders: [{ location: { kind: "events" }, name: "Events" }] },
    );

    await user.pointer({
      keys: "[MouseRight]",
      target: (await screen.findByText("Events")).closest("tr")!,
    });

    expect(screen.queryByRole("menuitem", { name: "Paste into" })).not.toBeInTheDocument();
  });
});

describe("DriveExplorer shortcuts", () => {
  const files = [makeFile("f1", "a.pdf")];

  it("copies with Caps Lock on", async () => {
    const user = userEvent.setup();
    renderExplorer({ kind: "root" }, { files });
    await selectRow(user, "Select a.pdf");
    await user.keyboard("{Meta>}C{/Meta}");

    const { result } = renderHook(() => useDriveClipboard("org-1"));
    expect(result.current.fileIds).toEqual(["f1"]);
  });

  it("pastes with Caps Lock on", async () => {
    const user = userEvent.setup();
    copyFiles("org-1", ["f1"]);
    renderExplorer({ kind: "folder", id: "folder-1" });
    await user.click(await screen.findByText("This folder is empty"));
    await user.keyboard("{Meta>}V{/Meta}");

    await waitFor(() => expect(addOccurrences).toHaveBeenCalled());
  });

  it("leaves native copy alone while text is highlighted", async () => {
    const user = userEvent.setup();
    renderExplorer({ kind: "root" }, { files });
    await selectRow(user, "Select a.pdf");
    const text = await screen.findByText("a.pdf");
    window.getSelection()?.selectAllChildren(text);
    await user.keyboard("{Meta>}c{/Meta}");
    window.getSelection()?.removeAllRanges();

    const { result } = renderHook(() => useDriveClipboard("org-1"));
    expect(result.current.fileIds).toEqual([]);
  });
});

describe("DriveExplorer removal", () => {
  const files = [makeFile("f1", "a.pdf")];
  const folderPlace = { kind: "folder", id: "folder-1" } as const;

  async function chooseDeleteFromContextMenu(user: ReturnType<typeof userEvent.setup>) {
    await user.pointer({
      keys: "[MouseRight]",
      target: (await screen.findByText("a.pdf")).closest("tr")!,
    });
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
  }

  it("names the folder and lists the remaining places when the file is elsewhere too", async () => {
    listFileOccurrences.mockResolvedValue([
      { place: folderPlace, path: ["Demos"] },
      { place: { kind: "song", id: "song-1" }, path: ["Songs", "Intro"] },
      { place: { kind: "root" }, path: [] },
    ]);
    removeOccurrence.mockResolvedValue({ deleted: false });
    const user = userEvent.setup();
    renderExplorer({ kind: "folder", id: "folder-1" }, { files }, [
      { name: "Demos", location: { kind: "folder", id: "folder-1" } },
    ]);
    await chooseDeleteFromContextMenu(user);

    expect(await screen.findByText("Remove from Demos?")).toBeInTheDocument();
    expect(screen.getByText("Songs › Intro")).toBeInTheDocument();
    expect(screen.getByText("Drive")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(removeOccurrence).toHaveBeenCalledWith({
        fileId: "f1",
        place: folderPlace,
        organizationId: "org-1",
      }),
    );
    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Removed from Demos — still in Songs › Intro, Drive",
        }),
      ),
    );
  });

  it("offers a permanent delete when this is the last place", async () => {
    listFileOccurrences.mockResolvedValue([{ place: { kind: "root" }, path: [] }]);
    removeOccurrence.mockResolvedValue({ deleted: true });
    const user = userEvent.setup();
    renderExplorer({ kind: "root" }, { files });
    await chooseDeleteFromContextMenu(user);

    expect(await screen.findByText("Permanently delete this file?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Permanently delete" }));

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "File deleted", type: "success" }),
      ),
    );
  });

  it("uses neutral wording when removing a file fails", async () => {
    listFileOccurrences.mockResolvedValue([
      { place: folderPlace, path: ["Demos"] },
      { place: { kind: "root" }, path: [] },
    ]);
    removeOccurrence.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderExplorer({ kind: "folder", id: "folder-1" }, { files }, [
      { name: "Demos", location: { kind: "folder", id: "folder-1" } },
    ]);
    await chooseDeleteFromContextMenu(user);
    await user.click(await screen.findByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Couldn't remove file", type: "error" }),
      ),
    );
  });

  it("states how many files a bulk removal only removes and how many it permanently deletes", async () => {
    listFileOccurrences.mockImplementation(({ fileId }: { fileId: string }) =>
      Promise.resolve(
        fileId === "f1"
          ? [
              { place: { kind: "root" }, path: [] },
              { place: { kind: "song", id: "song-1" }, path: ["Songs", "Intro"] },
            ]
          : [{ place: { kind: "root" }, path: [] }],
      ),
    );
    removeOccurrence.mockImplementation(({ fileId }: { fileId: string }) =>
      Promise.resolve({ deleted: fileId === "f2" }),
    );
    const user = userEvent.setup();
    renderExplorer({ kind: "root" }, { files: [makeFile("f1", "a.pdf"), makeFile("f2", "b.pdf")] });
    await selectRow(user, "Select a.pdf");
    await selectRow(user, "Select b.pdf");
    await user.click(screen.getByRole("button", { name: "Selection actions" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByText("Remove 2 files?")).toBeInTheDocument();
    expect(screen.getByText(/1 file will be removed from here/)).toBeInTheDocument();
    expect(screen.getByText(/1 file will be permanently deleted/)).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "1 file removed from here, 1 file permanently deleted",
          type: "success",
        }),
      ),
    );
  });

  it("keeps the folder Delete button disabled until the counts load", async () => {
    let resolvePreview: (value: { deletedCount: number; keptCount: number }) => void = () => {};
    previewFolderDelete.mockReturnValue(
      new Promise((resolve) => {
        resolvePreview = resolve;
      }),
    );
    const user = userEvent.setup();
    renderExplorer({ kind: "root" }, { folders: [folder] });

    await user.pointer({
      keys: "[MouseRight]",
      target: (await screen.findByText("Demos")).closest("tr")!,
    });
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(await screen.findByText("Counting files…")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();

    resolvePreview({ deletedCount: 2, keptCount: 0 });
    await screen.findByText(/2 files will be permanently deleted/);
    expect(screen.getByRole("button", { name: "Delete" })).toBeEnabled();
  });

  it("does not let a folder be deleted when the counts fail to load", async () => {
    previewFolderDelete.mockRejectedValue(new Error("boom"));
    const user = userEvent.setup();
    renderExplorer({ kind: "root" }, { folders: [folder] });

    await user.pointer({
      keys: "[MouseRight]",
      target: (await screen.findByText("Demos")).closest("tr")!,
    });
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    await screen.findByText(/Couldn't count the files/);
    expect(screen.getByRole("button", { name: "Delete" })).toBeDisabled();
  });

  it("states how many files a folder delete removes and keeps", async () => {
    previewFolderDelete.mockResolvedValue({ deletedCount: 3, keptCount: 1 });
    const user = userEvent.setup();
    renderExplorer({ kind: "root" }, { folders: [folder] });

    await user.pointer({
      keys: "[MouseRight]",
      target: (await screen.findByText("Demos")).closest("tr")!,
    });
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));

    expect(
      await screen.findByText(/3 files will be permanently deleted, 1 stays in other places/),
    ).toBeInTheDocument();
    expect(previewFolderDelete).toHaveBeenCalledWith({ id: "folder-1", organizationId: "org-1" });
  });
});

describe("DriveExplorer item count", () => {
  it("counts system folders", async () => {
    renderExplorer(
      { kind: "events" },
      {
        systemFolders: [
          { location: { kind: "event", id: "e1" }, name: "Gig" },
          { location: { kind: "event", id: "e2" }, name: "Rehearsal" },
        ],
      },
    );

    expect(await screen.findByText("2 items")).toBeInTheDocument();
  });
});
