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

import { SuspendedEventAttachments } from "./suspended-event-attachments";
import * as fileResource from "@/services/resources/file";

function makeFile(name = "demo.mp3") {
  return new File(["content"], name, { type: "audio/mpeg" });
}

let uploadRejection: unknown;

function useFailingUploadMutation() {
  return useMutation({
    mutationFn: async (_input: { eventId?: string; organizationId?: string; file: File }) => {
      throw uploadRejection;
    },
  });
}

function renderWithFiles(files: fileResource.EventFile[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  client.setQueryData(
    fileResource.getEventFilesQueryOptions({ eventId: "event-1" }).queryKey,
    files,
  );
  return render(
    <QueryClientProvider client={client}>
      <SuspendedEventAttachments eventId="event-1" />
    </QueryClientProvider>,
  );
}

describe("SuspendedEventAttachments", () => {
  it("shows the empty state and a zero file-count badge when there are no files", async () => {
    renderWithFiles([]);
    expect(await screen.findByText("No files linked yet.")).toBeInTheDocument();
    expect(screen.getByText("0 files")).toBeInTheDocument();
  });

  it("renders every linked file with a file-count badge", async () => {
    renderWithFiles([
      {
        id: "f1",
        kind: "audio",
        originalFilename: "demo.mp3",
        filename: "demo.mp3",
        downloadUrl: "https://example.com/demo.mp3",
        sizeBytes: 10,
        uploadedByName: "Jane",
      } as fileResource.EventFile,
      {
        id: "f2",
        kind: "document",
        originalFilename: "setlist.pdf",
        filename: "setlist.pdf",
        downloadUrl: "https://example.com/setlist.pdf",
        sizeBytes: 20,
        uploadedByName: "Jane",
      } as fileResource.EventFile,
    ]);

    expect(await screen.findByText("demo.mp3")).toBeInTheDocument();
    expect(screen.getByText("setlist.pdf")).toBeInTheDocument();
    expect(screen.getByText("2 files")).toBeInTheDocument();
  });

  it("shows an upgrade prompt linking to plan settings when an upload hits the storage quota", async () => {
    uploadRejection = Object.assign(new Error("Quota exceeded: storageBytes"), {
      data: { quota: { limitName: "storageBytes", limit: 1000, current: 950 } },
    });
    vi.spyOn(fileResource, "useUploadFileMutation").mockImplementation(useFailingUploadMutation);

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
    vi.spyOn(fileResource, "useUploadFileMutation").mockImplementation(useFailingUploadMutation);

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
    vi.spyOn(fileResource, "useUploadFileMutation").mockImplementation(useFailingUploadMutation);

    const user = userEvent.setup();
    renderWithFiles([]);
    const input = screen.getByLabelText("Add files", { selector: "input" });
    await user.upload(input, makeFile());

    expect(await screen.findByText("Upload failed")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "View plan" })).not.toBeInTheDocument();
  });
});
