import { fireEvent, render, screen } from "@testing-library/react";
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

  it("commits a rename on Enter", async () => {
    const user = userEvent.setup();
    const onRename = vi.fn();
    render(<AttachmentList files={[makeFile()]} onRename={onRename} />);

    await user.click(screen.getByRole("button", { name: "Actions for setlist.pdf" }));
    await user.click(await screen.findByText("Rename"));

    const input = screen.getByDisplayValue("setlist.pdf");
    await user.clear(input);
    await user.type(input, "new-name.pdf{Enter}");

    expect(onRename).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }), "new-name.pdf");
  });

  it("calls onDelete after confirming in the alert dialog", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<AttachmentList files={[makeFile()]} onDelete={onDelete} />);

    await user.click(screen.getByRole("button", { name: "Actions for setlist.pdf" }));
    await user.click(await screen.findByText("Delete"));
    await screen.findByText("Delete this file?");
    const deleteButton = screen.getByRole("button", { name: /^Delete$/ });
    await user.click(deleteButton);

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
