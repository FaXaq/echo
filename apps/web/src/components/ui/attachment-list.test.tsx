import { fireEvent, render, screen } from "@/lib/test-utils";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AttachmentList } from "./attachment-list";
import type { EventFile } from "@/services/resources/file";

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
