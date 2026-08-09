import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { EventGallery } from "./event-gallery";
import type { EventFile } from "@/services/resources/file";

const files: EventFile[] = [
  {
    id: "file-1",
    kind: "image",
    originalFilename: "cover.png",
    downloadUrl: "https://example.com/cover.png",
  } as EventFile,
  {
    id: "file-2",
    kind: "video",
    originalFilename: "clip.mp4",
    downloadUrl: "https://example.com/clip.mp4",
  } as EventFile,
  {
    id: "file-3",
    kind: "image",
    originalFilename: "poster.jpg",
    downloadUrl: "https://example.com/poster.jpg",
  } as EventFile,
];

describe("EventGallery", () => {
  it("renders an image thumbnail for image files and an icon placeholder for video files", () => {
    render(<EventGallery files={files} />);

    const imageTile = screen.getByRole("button", { name: "cover.png" });
    expect(imageTile.querySelector("img")).not.toBeNull();

    const videoTile = screen.getByRole("button", { name: "clip.mp4" });
    expect(videoTile.querySelector("img")).toBeNull();
    expect(videoTile.querySelector("svg")).not.toBeNull();
  });

  it("opens the lightbox with the clicked item selected", async () => {
    const user = userEvent.setup();
    render(<EventGallery files={files} />);

    await user.click(screen.getByRole("button", { name: "clip.mp4" }));

    expect(screen.getByRole("dialog", { name: "clip.mp4" })).toBeInTheDocument();
  });

  it("moves to the next and previous item without closing the dialog", async () => {
    const user = userEvent.setup();
    render(<EventGallery files={files} />);

    await user.click(screen.getByRole("button", { name: "cover.png" }));
    expect(screen.getByRole("dialog", { name: "cover.png" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Previous" })).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "clip.mp4" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Previous" }));
    expect(screen.getByRole("dialog", { name: "cover.png" })).toBeInTheDocument();
  });

  it("hides the next button on the last item", async () => {
    const user = userEvent.setup();
    render(<EventGallery files={files} />);

    await user.click(screen.getByRole("button", { name: "poster.jpg" }));

    expect(screen.getByRole("dialog", { name: "poster.jpg" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next" })).not.toBeInTheDocument();
  });

  it("shows the right item after closing the lightbox and opening a different tile", async () => {
    const user = userEvent.setup();
    render(<EventGallery files={files} />);

    await user.click(screen.getByRole("button", { name: "cover.png" }));
    expect(screen.getByRole("dialog", { name: "cover.png" })).toBeInTheDocument();

    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "poster.jpg" }));
    expect(screen.getByRole("dialog", { name: "poster.jpg" })).toBeInTheDocument();
  });

  it("renders an empty tile for audio files", () => {
    const audioFiles: EventFile[] = [
      {
        id: "file-1",
        kind: "audio",
        originalFilename: "song.mp3",
        downloadUrl: "https://example.com/song.mp3",
      } as EventFile,
    ];

    render(<EventGallery files={audioFiles} />);

    const audioTile = screen.getByRole("button", { name: "song.mp3" });
    expect(audioTile.querySelector("img")).toBeNull();
    expect(audioTile.querySelector("svg")).toBeNull();
  });

  it("does not render a delete button when onDelete is not provided", () => {
    render(<EventGallery files={files} />);

    expect(screen.queryByRole("button", { name: "Delete cover.png" })).not.toBeInTheDocument();
  });

  it("calls onDelete with the file after confirming deletion", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<EventGallery files={files} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Delete cover.png" }));
    const confirmDialog = await screen.findByRole("alertdialog");
    await user.click(within(confirmDialog).getByRole("button", { name: "Delete" }));

    expect(onDelete).toHaveBeenCalledWith(files[0]);
  });

  it("does not open the lightbox when clicking the delete button", async () => {
    const user = userEvent.setup();
    render(<EventGallery files={files} onDelete={vi.fn()} />);

    await user.click(screen.getByRole("button", { name: "Delete cover.png" }));

    expect(screen.queryByRole("dialog", { name: "cover.png" })).not.toBeInTheDocument();
  });
});
