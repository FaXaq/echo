import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { EventAttachments } from "./event-attachments";
import * as fileResource from "@/services/resources/file";

vi.mock("@/components/ui/audio-player", () => ({
  AudioPlayer: ({ filename }: { filename: string }) => <div>Player: {filename}</div>,
}));

vi.mock("@/components/ui/event-gallery", () => ({
  EventGallery: ({
    files,
    onDelete,
  }: {
    files: fileResource.EventFile[];
    onDelete?: (file: fileResource.EventFile) => void;
  }) => (
    <div>
      Gallery: {files.map((file) => file.originalFilename).join(", ")}
      {onDelete &&
        files.map((file) => (
          <button key={file.id} onClick={() => onDelete(file)}>
            Delete {file.originalFilename}
          </button>
        ))}
    </div>
  ),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe("EventAttachments", () => {
  beforeEach(() => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [],
    } as never);
  });

  it("renders the upload dropzone even when there are no files", async () => {
    renderWithClient(<EventAttachments eventId="event-1" />);
    expect(await screen.findByLabelText("Add files")).toBeInTheDocument();
  });

  it("renders an AudioPlayer for audio files", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-1",
          kind: "audio",
          originalFilename: "demo.mp3",
          downloadUrl: "https://example.com/demo.mp3",
          uploadedBy: "Alex",
        } as fileResource.EventFile,
      ],
    } as never);

    renderWithClient(<EventAttachments eventId="event-1" />);
    expect(await screen.findByText("Player: demo.mp3")).toBeInTheDocument();
  });

  it("renders image and video files in the EventGallery", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-2",
          kind: "image",
          originalFilename: "cover.png",
          downloadUrl: "https://example.com/cover.png",
        } as fileResource.EventFile,
        {
          id: "file-3",
          kind: "video",
          originalFilename: "clip.mp4",
          downloadUrl: "https://example.com/clip.mp4",
        } as fileResource.EventFile,
      ],
    } as never);

    renderWithClient(<EventAttachments eventId="event-1" />);
    expect(await screen.findByText("Gallery: cover.png, clip.mp4")).toBeInTheDocument();
    expect(screen.queryByText(/^Player:/)).not.toBeInTheDocument();
  });

  it("renders both sections when audio and image files are mixed", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-1",
          kind: "audio",
          originalFilename: "demo.mp3",
          downloadUrl: "https://example.com/demo.mp3",
          uploadedBy: "Alex",
        } as fileResource.EventFile,
        {
          id: "file-2",
          kind: "image",
          originalFilename: "cover.png",
          downloadUrl: "https://example.com/cover.png",
        } as fileResource.EventFile,
      ],
    } as never);

    renderWithClient(<EventAttachments eventId="event-1" />);
    expect(await screen.findByText("Player: demo.mp3")).toBeInTheDocument();
    expect(await screen.findByText("Gallery: cover.png")).toBeInTheDocument();
  });

  it("uploads a picked file via useUploadFileMutation, including organizationId", async () => {
    const mutateSpy = vi.fn();
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
      isError: false,
    } as never);
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: vi.fn(),
    } as never);

    const user = userEvent.setup();
    renderWithClient(<EventAttachments eventId="event-1" organizationId="org-1" />);

    const input = await screen.findByLabelText("Add files", { selector: "input" });
    const file = new File(["x"], "demo.mp3", { type: "audio/mpeg" });
    await user.upload(input, file);

    expect(mutateSpy).toHaveBeenCalledWith({ eventId: "event-1", organizationId: "org-1", file });
  });

  it("shows the specific server error message when upload fails", async () => {
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("File is too large"),
    } as never);
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: vi.fn(),
    } as never);

    renderWithClient(<EventAttachments eventId="event-1" />);

    expect(await screen.findByText("File is too large")).toBeInTheDocument();
    expect(screen.queryByText("Upload failed")).not.toBeInTheDocument();
  });

  it("requests deletion via useDeleteFileMutation when confirming delete on an audio file", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-1",
          kind: "audio",
          originalFilename: "demo.mp3",
          downloadUrl: "https://example.com/demo.mp3",
          uploadedBy: "Alex",
        } as fileResource.EventFile,
      ],
    } as never);
    const deleteSpy = vi.fn();
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as never);
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: deleteSpy,
    } as never);

    const user = userEvent.setup();
    renderWithClient(<EventAttachments eventId="event-1" />);

    await screen.findByText("Player: demo.mp3");
    await user.click(screen.getByRole("button", { name: "Delete demo.mp3" }));
    const confirmDialog = await screen.findByRole("alertdialog");
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    expect(deleteSpy).toHaveBeenCalledWith({ id: "file-1" });
  });

  it("requests deletion via useDeleteFileMutation when the gallery reports a delete", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-2",
          kind: "image",
          originalFilename: "cover.png",
          downloadUrl: "https://example.com/cover.png",
        } as fileResource.EventFile,
      ],
    } as never);
    const deleteSpy = vi.fn();
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as never);
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: deleteSpy,
    } as never);

    const user = userEvent.setup();
    renderWithClient(<EventAttachments eventId="event-1" />);

    await user.click(await screen.findByText("Delete cover.png"));

    expect(deleteSpy).toHaveBeenCalledWith({ id: "file-2" });
  });
});
