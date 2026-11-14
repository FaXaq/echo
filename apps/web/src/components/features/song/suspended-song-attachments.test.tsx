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

import { SuspendedSongAttachments } from "./suspended-song-attachments";
import * as driveResource from "@/services/resources/drive";

function makeSongFile(overrides: Partial<driveResource.SongFile> = {}): driveResource.SongFile {
  return {
    id: "f1",
    organizationId: "org-1",
    uploadedBy: "user-1",
    uploadedByName: "Jane",
    kind: "audio",
    mimeType: "audio/mpeg",
    sizeBytes: 10,
    durationSeconds: null,
    width: null,
    height: null,
    hasThumbnail: false,
    thumbnailUrl: null,
    filename: "demo.mp3",
    originalFilename: "demo.mp3",
    s3Key: "songs/song-1/demo.mp3",
    status: "uploaded",
    createdAt: null,
    updatedAt: null,
    role: null,
    version: null,
    linkedAt: "2026-08-02T09:30:00.000Z",
    linkedBy: "user-1",
    downloadUrl: "https://example.com/demo.mp3",
    previewUrl: null,
    ...overrides,
  };
}

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

function renderWithFiles(files: driveResource.SongFile[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    driveResource.getSongFilesQueryOptions({ songId: "song-1", organizationId: "org-1" }).queryKey,
    files,
  );
  return render(
    <QueryClientProvider client={client}>
      <SuspendedSongAttachments songId="song-1" organizationId="org-1" />
    </QueryClientProvider>,
  );
}

const songPlace = { kind: "song", id: "song-1" } as const;

async function chooseDelete(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("button", { name: "Actions for demo.mp3" }));
  await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SuspendedSongAttachments removal", () => {
  it("says 'Remove from this song' and lists 'Events › 2026-08-02 · Gig' when the file is also on an event", async () => {
    listFileOccurrences.mockResolvedValue([
      { place: songPlace, path: ["Songs", "Intro"] },
      { place: { kind: "event", id: "event-1" }, path: ["Events", "2026-08-02 · Gig"] },
      { place: { kind: "folder", id: "folder-1" }, path: ["Demos", "Old"] },
    ]);
    removeOccurrence.mockResolvedValue({ deleted: false });
    const user = userEvent.setup();
    renderWithFiles([makeSongFile()]);

    await chooseDelete(user);

    expect(await screen.findByText("Remove from this song?")).toBeInTheDocument();
    expect(screen.getByText("Events › 2026-08-02 · Gig")).toBeInTheDocument();
    expect(screen.getByText("Demos › Old")).toBeInTheDocument();
    expect(screen.queryByText("Songs › Intro")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Remove" }));

    await waitFor(() =>
      expect(removeOccurrence).toHaveBeenCalledWith({
        fileId: "f1",
        place: songPlace,
        organizationId: "org-1",
      }),
    );
  });

  it("says 'Permanently delete' when the song is its only occurrence", async () => {
    listFileOccurrences.mockResolvedValue([{ place: songPlace, path: ["Songs", "Intro"] }]);
    removeOccurrence.mockResolvedValue({ deleted: true });
    const user = userEvent.setup();
    renderWithFiles([makeSongFile()]);

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

describe("SuspendedSongAttachments", () => {
  it("shows the empty state and an upload button when there are no files", async () => {
    renderWithFiles([]);
    expect(await screen.findByText("No files yet")).toBeInTheDocument();
    expect(screen.getByLabelText("Add files", { selector: "input" })).toBeInTheDocument();
  });

  it("renders every linked file grouped by tab", async () => {
    const user = userEvent.setup();
    renderWithFiles([
      makeSongFile(),
      makeSongFile({
        id: "f2",
        filename: "chart.pdf",
        originalFilename: "chart.pdf",
        kind: "document",
      }),
    ]);

    expect(await screen.findByText("demo.mp3")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Misc/ }));
    expect(screen.getByText("chart.pdf")).toBeInTheDocument();
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
  });
});
