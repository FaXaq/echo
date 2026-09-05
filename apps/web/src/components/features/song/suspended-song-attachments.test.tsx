import { QueryClient, QueryClientProvider, useMutation } from "@tanstack/react-query";
import { render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

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
    eventId: null,
    eventTitle: null,
    songId: "song-1",
    folderId: null,
    organizationId: "org-1",
    uploadedBy: "user-1",
    uploadedByName: "Jane",
    kind: "audio",
    mimeType: "audio/mpeg",
    sizeBytes: 10,
    filename: "demo.mp3",
    originalFilename: "demo.mp3",
    s3Key: "songs/song-1/demo.mp3",
    status: "uploaded",
    createdAt: null,
    updatedAt: null,
    downloadUrl: "https://example.com/demo.mp3",
    ...overrides,
  };
}

function makeFile(name = "demo.mp3") {
  return new File(["content"], name, { type: "audio/mpeg" });
}

let uploadRejection: unknown;

function useFailingUploadMutation() {
  return useMutation({
    mutationFn: async (_input: { songId?: string; organizationId: string; file: File }) => {
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

describe("SuspendedSongAttachments", () => {
  it("shows the empty state and an upload button when there are no files", async () => {
    renderWithFiles([]);
    expect(await screen.findByText("No files here yet.")).toBeInTheDocument();
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
