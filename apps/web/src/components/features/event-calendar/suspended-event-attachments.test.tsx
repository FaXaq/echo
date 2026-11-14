import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { render, screen, waitFor } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const listFileOccurrences = vi.fn();
const removeOccurrence = vi.fn();
const toastAdd = vi.fn();

vi.mock("@/services/api-client", () => ({
  apiClient: {
    drive: {
      listFileOccurrences: { query: (input: unknown) => listFileOccurrences(input) },
      removeOccurrence: { mutate: (input: unknown) => removeOccurrence(input) },
    },
  },
}));
vi.mock("@/components/ui/toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/components/ui/toast")>()),
  toast: { add: (options: unknown) => toastAdd(options) },
}));

vi.mock("@tanstack/react-router", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@tanstack/react-router")>()),
  Link: ({
    children,
    to,
    params,
  }: {
    children?: React.ReactNode;
    to?: string;
    params?: Record<string, string>;
  }) => (
    <a href="#" data-to={to} data-params={JSON.stringify(params)}>
      {children}
    </a>
  ),
  useParams: () => ({ projectSlug: "acme-inc" }),
}));

import { SuspendedEventAttachments } from "./suspended-event-attachments";
import * as driveResource from "@/services/resources/drive";

function makeFile(name = "demo.mp3") {
  return new File(["content"], name, { type: "audio/mpeg" });
}

let uploadRejection: unknown;

function useFailingUploadMutation() {
  return useMutation({
    mutationFn: async (_input: driveResource.UploadFileInput) => {
      throw uploadRejection;
    },
  });
}

function renderWithFiles(files: driveResource.EventFile[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    driveResource.getEventFilesQueryOptions({ eventId: "event-1", organizationId: "org-1" })
      .queryKey,
    files,
  );
  return render(
    <QueryClientProvider client={client}>
      <SuspendedEventAttachments eventId="event-1" organizationId="org-1" />
    </QueryClientProvider>,
  );
}

const eventPlace = { kind: "event", id: "event-1" } as const;

function demoFile() {
  return {
    id: "f1",
    kind: "audio",
    originalFilename: "demo.mp3",
    filename: "demo.mp3",
    downloadUrl: "https://example.com/demo.mp3",
    sizeBytes: 10,
    uploadedByName: "Jane",
  } as driveResource.EventFile;
}

async function chooseDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Actions for demo.mp3" }));
  await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SuspendedEventAttachments removal", () => {
  it("says 'Remove from this event' and lists 'Songs › Intro' when the file is also on a song", async () => {
    listFileOccurrences.mockResolvedValue([
      { place: eventPlace, path: ["Events", "2026-08-02 · Gig"] },
      { place: { kind: "song", id: "song-1" }, path: ["Songs", "Intro"] },
    ]);
    removeOccurrence.mockResolvedValue({ deleted: false });
    const user = userEvent.setup();
    renderWithFiles([demoFile()]);

    await chooseDelete(user);

    expect(await screen.findByText("Remove from this event?")).toBeInTheDocument();
    expect(screen.getByText("Songs › Intro")).toBeInTheDocument();
    expect(screen.queryByText("Events › 2026-08-02 · Gig")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(removeOccurrence).toHaveBeenCalledWith({
        fileId: "f1",
        place: eventPlace,
        organizationId: "org-1",
      }),
    );
    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          title: "Removed from this event — still in Songs › Intro",
          type: "success",
        }),
      ),
    );
  });

  it("says 'Permanently delete' when the event is its only occurrence", async () => {
    listFileOccurrences.mockResolvedValue([
      { place: eventPlace, path: ["Events", "2026-08-02 · Gig"] },
    ]);
    removeOccurrence.mockResolvedValue({ deleted: true });
    const user = userEvent.setup();
    renderWithFiles([demoFile()]);

    await chooseDelete(user);

    expect(await screen.findByText("Permanently delete this file?")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Permanently delete" }));

    await waitFor(() =>
      expect(toastAdd).toHaveBeenCalledWith(
        expect.objectContaining({ title: "File deleted", type: "success" }),
      ),
    );
  });
});

describe("SuspendedEventAttachments", () => {
  it("shows the empty state and an upload button when there are no files", async () => {
    renderWithFiles([]);
    expect(await screen.findByText("No files yet")).toBeInTheDocument();
    expect(screen.getByLabelText("Add files", { selector: "input" })).toBeInTheDocument();
  });

  it("renders every linked file grouped by tab", async () => {
    const user = userEvent.setup();
    renderWithFiles([
      {
        id: "f1",
        kind: "audio",
        originalFilename: "demo.mp3",
        filename: "demo.mp3",
        downloadUrl: "https://example.com/demo.mp3",
        sizeBytes: 10,
        uploadedByName: "Jane",
      } as driveResource.EventFile,
      {
        id: "f2",
        kind: "document",
        originalFilename: "setlist.pdf",
        filename: "setlist.pdf",
        downloadUrl: "https://example.com/setlist.pdf",
        sizeBytes: 20,
        uploadedByName: "Jane",
      } as driveResource.EventFile,
    ]);

    expect(await screen.findByText("demo.mp3")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Misc/ }));
    expect(screen.getByText("setlist.pdf")).toBeInTheDocument();
  });

  it("shows an upgrade prompt linking to plan settings when an upload hits the storage quota", async () => {
    uploadRejection = Object.assign(new Error("Quota exceeded: storageBytes"), {
      data: { quota: { limitName: "storageBytes", limit: 1000, current: 950 } },
    });
    vi.spyOn(driveResource, "useUploadFileMutation").mockImplementation(useFailingUploadMutation);

    const user = userEvent.setup();
    renderWithFiles([]);
    const input = screen.getByLabelText("Add files", { selector: "input" });
    await user.upload(input, makeFile());

    expect(await screen.findByText(/reached its plan limit/)).toBeInTheDocument();
    const link = screen.getByRole("link", { name: "View plan" });
    expect(link).toHaveAttribute("data-to", "/projects/$projectSlug/settings");
    expect(link).toHaveAttribute("data-params", JSON.stringify({ projectSlug: "acme-inc" }));
  });

  it("shows a file-too-large message, not the project-full message, when an upload hits the max file size", async () => {
    uploadRejection = Object.assign(new Error("Quota exceeded: maxFileSizeBytes"), {
      data: { quota: { limitName: "maxFileSizeBytes", limit: 1000, current: 2000 } },
    });
    vi.spyOn(driveResource, "useUploadFileMutation").mockImplementation(useFailingUploadMutation);

    const user = userEvent.setup();
    renderWithFiles([]);
    const input = screen.getByLabelText("Add files", { selector: "input" });
    await user.upload(input, makeFile());

    expect(await screen.findByText(/too large for your plan/)).toBeInTheDocument();
    expect(screen.queryByText(/reached its plan limit/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View plan" })).not.toBeInTheDocument();
  });

  it("shows the generic upload-failed message for a non-quota upload error", async () => {
    uploadRejection = new Error("Upload failed");
    vi.spyOn(driveResource, "useUploadFileMutation").mockImplementation(useFailingUploadMutation);

    const user = userEvent.setup();
    renderWithFiles([]);
    const input = screen.getByLabelText("Add files", { selector: "input" });
    await user.upload(input, makeFile());

    expect(await screen.findByText("Upload failed")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View plan" })).not.toBeInTheDocument();
  });
});
