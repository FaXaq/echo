import { fireEvent, render, screen, waitFor } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response("x", { status: 206 })),
  );
});
afterEach(() => vi.unstubAllGlobals());

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

  it("marks selected files with a check", () => {
    const { container } = render(
      <AttachmentList
        files={[
          makeFile({ id: "audio-1", kind: "audio", filename: "demo.mp3" }),
          makeFile({ id: "audio-2", kind: "audio", filename: "final.wav" }),
        ]}
        selectedIds={new Set(["audio-1"])}
      />,
    );

    expect(container.querySelectorAll("svg.lucide-check")).toHaveLength(1);
    expect(container.querySelectorAll('[data-state="selected"]')).toHaveLength(1);
  });

  it("shows a music icon for audio files and a playing icon for the current one", () => {
    const files = [
      makeFile({ id: "audio-1", kind: "audio", filename: "demo.mp3" }),
      makeFile({ id: "audio-2", kind: "audio", filename: "final.wav" }),
    ];
    const { container } = render(<AttachmentList files={files} playingFileId="audio-2" />);

    expect(container.querySelectorAll("svg.lucide-music")).toHaveLength(1);
    expect(container.querySelectorAll("svg.lucide-audio-lines")).toHaveLength(1);
  });

  it("shows the file extension in place of an icon for documents", async () => {
    render(<AttachmentList files={[makeFile({ filename: "setlist.pdf" })]} />);

    expect(await screen.findByText("PDF")).toBeInTheDocument();
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
            thumbnailUrl: "https://example.com/cover.png.thumbnail.jpg",
          }),
          makeFile({
            id: "video-1",
            kind: "video",
            filename: "rehearsal.mp4",
            downloadUrl: "https://example.com/rehearsal.mp4",
            thumbnailUrl: "https://example.com/rehearsal.mp4.thumbnail.jpg",
          }),
        ]}
      />,
    );

    expect(await screen.findByRole("img", { name: "cover.png" })).toHaveAttribute(
      "src",
      "https://example.com/cover.png.thumbnail.jpg",
    );
    const videoTile = screen.getByRole("img", { name: "rehearsal.mp4" });
    expect(videoTile).toHaveAttribute("src", "https://example.com/rehearsal.mp4.thumbnail.jpg");
    expect(videoTile).toHaveAttribute("loading", "lazy");
    expect(document.querySelector("video")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Open cover.png" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  it.each([
    { name: "landscape", width: 480, height: 320, column: "span 2", row: "span 1" },
    { name: "portrait", width: 320, height: 480, column: "span 1", row: "span 2" },
    { name: "near-square", width: 400, height: 500, column: "span 1", row: "span 1" },
    { name: "unmeasured", width: null, height: null, column: "span 1", row: "span 1" },
  ])("sizes a $name tile from its dimensions", async ({ name, width, height, column, row }) => {
    render(
      <AttachmentList
        files={[
          makeFile({
            id: name,
            kind: "image",
            filename: name,
            thumbnailUrl: `https://example.com/${name}.jpg`,
            width,
            height,
          }),
        ]}
      />,
    );

    const tile = (await screen.findByRole("img", { name })).closest("li");
    expect(tile?.style.gridColumn).toBe(column);
    expect(tile?.style.gridRow).toBe(row);
  });

  it("shows no thumbnail without requesting the original", async () => {
    render(
      <AttachmentList
        files={[
          makeFile({
            id: "image-1",
            kind: "image",
            filename: "cover.png",
            downloadUrl: "https://example.com/cover.png",
            thumbnailUrl: null,
          }),
        ]}
      />,
    );

    expect(await screen.findByText("No thumbnail")).toBeInTheDocument();
    expect(document.querySelector("img")).toBeNull();
  });

  it("keeps the video duration chip and adds a GIF chip without a thumbnail", async () => {
    render(
      <AttachmentList
        files={[
          makeFile({
            id: "video-1",
            kind: "video",
            filename: "rehearsal.mp4",
            durationSeconds: 32,
            thumbnailUrl: null,
          }),
          makeFile({
            id: "gif-1",
            kind: "image",
            filename: "loop.gif",
            mimeType: "image/gif",
            thumbnailUrl: null,
          }),
        ]}
      />,
    );

    expect(await screen.findByText("0:32")).toBeInTheDocument();
    expect(screen.getByText("GIF")).toBeInTheDocument();
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

  it("selects on macOS ctrl+click, which fires contextmenu, without opening the menu", async () => {
    const onSelect = vi.fn();
    render(<AttachmentList files={[makeFile()]} onSelect={onSelect} />);

    fireEvent.contextMenu(screen.getByText("setlist.pdf"), { ctrlKey: true, button: 0 });

    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }));
    expect(screen.queryByText("Rename")).not.toBeInTheDocument();
  });

  it("selects on plain click instead of opening once something is selected", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const onUnselect = vi.fn();
    render(
      <AttachmentList
        files={[
          makeFile({ id: "image-1", kind: "image", filename: "cover.png" }),
          makeFile({ id: "image-2", kind: "image", filename: "stage.png" }),
        ]}
        selectedIds={new Set(["image-1"])}
        onSelect={onSelect}
        onUnselect={onUnselect}
      />,
    );

    await user.click(await screen.findByRole("button", { name: "Open stage.png" }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: "image-2" }));

    await user.click(screen.getByRole("button", { name: "Open cover.png" }));
    expect(onUnselect).toHaveBeenCalledWith(expect.objectContaining({ id: "image-1" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
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

  it("shows duration next to file size when known, and just the size when it isn't", () => {
    render(
      <AttachmentList
        files={[
          makeFile({
            id: "audio-1",
            kind: "audio",
            filename: "no-duration-yet.mp3",
            sizeBytes: 2048,
          }),
          makeFile({
            id: "audio-2",
            kind: "audio",
            filename: "demo.mp3",
            sizeBytes: 2048,
            durationSeconds: 65,
          }),
        ]}
      />,
    );

    expect(screen.getByText("2 KB")).toBeInTheDocument();
    expect(screen.getByText("2 KB · 1:05")).toBeInTheDocument();
  });

  it("shows an error state in the row and preview dialog when the file is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<Error/>", { status: 404 })),
    );
    const user = userEvent.setup();
    render(<AttachmentList files={[makeFile()]} />);

    await user.click(screen.getByRole("button", { name: "Open setlist.pdf" }));

    expect(await screen.findAllByText("Couldn't load this file")).not.toHaveLength(0);
    expect(screen.queryByTitle("setlist.pdf")).not.toBeInTheDocument();
  });
});

describe("AttachmentList gallery errors", () => {
  it("retries a failed thumbnail when a freshly signed URL arrives", async () => {
    const file = (thumbnailUrl: string) =>
      makeFile({ id: "image-1", kind: "image", filename: "gone.png", thumbnailUrl });
    const { rerender } = render(<AttachmentList files={[file("https://example.com/old.jpg")]} />);

    fireEvent.error(await screen.findByRole("img", { name: "gone.png" }));
    expect(await screen.findByText("No thumbnail")).toBeInTheDocument();

    rerender(<AttachmentList files={[file("https://example.com/new.jpg")]} />);

    expect(await screen.findByRole("img", { name: "gone.png" })).toHaveAttribute(
      "src",
      "https://example.com/new.jpg",
    );
  });

  it("shows no thumbnail and still opens the carousel when the thumbnail fails", async () => {
    const user = userEvent.setup();
    render(
      <AttachmentList
        files={[
          makeFile({
            id: "image-1",
            kind: "image",
            filename: "gone.png",
            thumbnailUrl: "https://example.com/gone.png.thumbnail.jpg",
          }),
        ]}
      />,
    );

    fireEvent.error(await screen.findByRole("img", { name: "gone.png" }));

    expect(await screen.findByText("No thumbnail")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Open gone.png" }));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });
});
