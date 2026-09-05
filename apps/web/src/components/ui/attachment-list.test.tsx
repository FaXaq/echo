import { fireEvent, render, screen, waitFor } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttachmentList } from "./attachment-list";
import type { EventFile } from "@/services/resources/drive";

function makeFile(overrides: Partial<EventFile> = {}): EventFile {
  return {
    id: "doc-1",
    kind: "document",
    originalFilename: "setlist.pdf",
    filename: "setlist.pdf",
    downloadUrl: "https://example.com/setlist.pdf",
    sizeBytes: 2048,
    mimeType: "application/pdf",
    uploadedByName: "Jane",
    ...overrides,
  } as EventFile;
}

describe("AttachmentList", () => {
  it("renders the filename and opens a preview dialog when clicked", async () => {
    const user = userEvent.setup();
    render(<AttachmentList files={[makeFile()]} />);

    await user.click(screen.getByRole("button", { name: "Open setlist.pdf" }));

    const dialog = await screen.findByRole("dialog");
    expect(dialog).toBeInTheDocument();
  });

  it("calls onRename with the file when Rename is chosen from the actions menu", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<AttachmentList files={[makeFile()]} onRename={onRename} />);

    await user.click(screen.getByRole("button", { name: "Actions for setlist.pdf" }));
    await user.click(await screen.findByText("Rename"));

    expect(onRename).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }));
  });

  it("calls onDelete with the file when Delete is chosen from the actions menu", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<AttachmentList files={[makeFile()]} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Actions for setlist.pdf" }));
    await user.click(await screen.findByText("Delete"));

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }));
  });

  it("shows a music icon for audio files and a document icon otherwise", () => {
    const { container } = render(
      <AttachmentList
        files={[
          makeFile({ id: "doc-1", kind: "document", filename: "setlist.pdf" }),
          makeFile({ id: "audio-1", kind: "audio", filename: "demo.mp3" }),
        ]}
      />,
    );

    expect(container.querySelector("svg.lucide-music")).toBeTruthy();
  });

  it("opens the actions menu when right-clicking an attachment", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<AttachmentList files={[makeFile()]} onRename={onRename} />);

    fireEvent.contextMenu(screen.getByText("setlist.pdf"));

    await user.click(await screen.findByText("Rename"));
    expect(onRename).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }));
  });

  it("lists pending uploads with a loading indicator alongside existing files", () => {
    render(
      <AttachmentList
        files={[makeFile()]}
        pendingFiles={[{ key: 1, filename: "demo.mp3", sizeBytes: 2048 }]}
      />,
    );

    expect(screen.getByText("demo.mp3")).toBeInTheDocument();
    expect(screen.getByText("Uploading…")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Open demo.mp3" })).not.toBeInTheDocument();
  });

  it("splits files into Audio, Gallery and Misc tabs and filters by the active tab", async () => {
    const user = userEvent.setup();
    render(
      <AttachmentList
        files={[
          makeFile({ id: "doc-1", kind: "document", filename: "setlist.pdf" }),
          makeFile({ id: "audio-1", kind: "audio", filename: "demo.mp3" }),
          makeFile({ id: "image-1", kind: "image", filename: "cover.png" }),
        ]}
      />,
    );

    expect(screen.getByText("demo.mp3")).toBeInTheDocument();
    expect(screen.queryByText("setlist.pdf")).not.toBeInTheDocument();
    expect(screen.queryByText("cover.png")).not.toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Gallery/ }));
    expect(await screen.findByText("cover.png")).toBeInTheDocument();

    await user.click(screen.getByRole("tab", { name: /Misc/ }));
    expect(await screen.findByText("setlist.pdf")).toBeInTheDocument();
  });

  it("renders the Gallery tab as an image/video grid", async () => {
    const user = userEvent.setup();
    render(
      <AttachmentList
        files={[
          makeFile({
            id: "image-1",
            kind: "image",
            filename: "cover.png",
            downloadUrl: "https://example.com/cover.png",
          }),
          makeFile({
            id: "video-1",
            kind: "video",
            filename: "rehearsal.mp4",
            downloadUrl: "https://example.com/rehearsal.mp4",
          }),
        ]}
      />,
    );

    expect(await screen.findByRole("img", { name: "cover.png" })).toHaveAttribute(
      "src",
      "https://example.com/cover.png",
    );
    const video = document.querySelector("video");
    expect(video).toHaveAttribute("src", "https://example.com/rehearsal.mp4");

    await user.click(screen.getByRole("button", { name: "Open cover.png" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it("opens the actions menu when right-clicking a gallery tile", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(
      <AttachmentList
        files={[makeFile({ id: "image-1", kind: "image", filename: "cover.png" })]}
        onDelete={onDelete}
      />,
    );

    fireEvent.contextMenu(await screen.findByText("cover.png"));

    await user.click(await screen.findByText("Delete"));
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "image-1" }));
  });

  it("toggles selection with ctrl+click instead of opening the preview", async () => {
    const onSelect = vi.fn();
    const onUnselect = vi.fn();
    const { rerender } = render(
      <AttachmentList files={[makeFile()]} onSelect={onSelect} onUnselect={onUnselect} />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open setlist.pdf" }), { ctrlKey: true });
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    rerender(
      <AttachmentList
        files={[makeFile()]}
        selectedIds={new Set(["doc-1"])}
        onSelect={onSelect}
        onUnselect={onUnselect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "Open setlist.pdf" }), { ctrlKey: true });
    expect(onUnselect).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }));
  });

  it("toggles selection via the Select entry in the actions menu", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<AttachmentList files={[makeFile()]} onSelect={onSelect} />);

    await user.click(screen.getByRole("button", { name: "Actions for setlist.pdf" }));
    await user.click(await screen.findByText("Select"));

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }));
  });

  it("shows a bulk actions menu that deletes the selection with a loader until it completes", async () => {
    const user = userEvent.setup();
    let resolveDelete: () => void = () => {};
    const onDeleteSelected = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveDelete = resolve;
        }),
    );

    render(
      <AttachmentList
        files={[makeFile(), makeFile({ id: "doc-2", filename: "chart.pdf" })]}
        selectedIds={new Set(["doc-1", "doc-2"])}
        onDeleteSelected={onDeleteSelected}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Actions for selected files" }));
    await user.click(await screen.findByText("Delete"));

    expect(await screen.findByText("Delete 2 files?")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(onDeleteSelected).toHaveBeenCalledWith([
      expect.objectContaining({ id: "doc-1" }),
      expect.objectContaining({ id: "doc-2" }),
    ]);
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    resolveDelete();
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows an error state in the row and preview dialog when the file fails to load", async () => {
    const user = userEvent.setup();
    render(<AttachmentList files={[makeFile()]} />);

    await user.click(screen.getByRole("button", { name: "Open setlist.pdf" }));
    const iframe = await screen.findByTitle("setlist.pdf");
    fireEvent.error(iframe);

    expect(await screen.findAllByText("Couldn't load this file")).not.toHaveLength(0);
    expect(screen.queryByTitle("setlist.pdf")).not.toBeInTheDocument();
  });
});
