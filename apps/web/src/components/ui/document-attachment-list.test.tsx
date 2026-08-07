import { render, screen, within, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { DocumentAttachmentList } from "./document-attachment-list"
import type { EventFile } from "@/services/resources/file"

function makeFile(overrides: Partial<EventFile> = {}): EventFile {
  return {
    id: "doc-1",
    kind: "document",
    originalFilename: "setlist.pdf",
    downloadUrl: "https://example.com/setlist.pdf",
    sizeBytes: 2048,
    mimeType: "application/pdf",
    uploadedByName: "Jane",
    ...overrides,
  } as EventFile
}

describe("DocumentAttachmentList", () => {
  it("renders the filename and opens a preview dialog when clicked", async () => {
    const user = userEvent.setup()
    render(<DocumentAttachmentList files={[makeFile()]} />)

    await user.click(screen.getByRole("button", { name: "Open setlist.pdf" }))

    const dialog = await screen.findByRole("dialog")
    expect(dialog).toBeInTheDocument()
  })

  it("commits a rename on Enter", async () => {
    const user = userEvent.setup()
    const onRename = vi.fn()
    render(<DocumentAttachmentList files={[makeFile()]} onRename={onRename} />)

    await user.click(screen.getByRole("button", { name: "Actions for setlist.pdf" }))
    await user.click(await screen.findByText("Rename"))

    const input = screen.getByDisplayValue("setlist.pdf")
    await user.clear(input)
    await user.type(input, "new-name.pdf{Enter}")

    expect(onRename).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }), "new-name.pdf")
  })

  it("calls onDelete after confirming in the alert dialog", async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<DocumentAttachmentList files={[makeFile()]} onDelete={onDelete} />)

    await user.click(screen.getByRole("button", { name: "Actions for setlist.pdf" }))
    await user.click(await screen.findByText("Delete"))
    await screen.findByText("Delete this file?")
    const deleteButton = screen.getByRole("button", { name: /^Delete$/ })
    await user.click(deleteButton)

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: "doc-1" }))
  })
})
