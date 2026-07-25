import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi, beforeEach } from "vitest"
import { EventFileAttachments } from "./event-file-attachments"
import * as fileResource from "@/services/resources/file"

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe("EventFileAttachments", () => {
  beforeEach(() => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [],
    } as never)
  })

  it("shows the empty state when there are no files", async () => {
    renderWithClient(<EventFileAttachments eventId="event-1" />)
    expect(await screen.findByText("No files attached")).toBeInTheDocument()
  })

  it("uploads a picked file via useUploadFileMutation", async () => {
    const mutateSpy = vi.fn()
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: mutateSpy,
      isPending: false,
      isError: false,
    } as never)
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: vi.fn(),
    } as never)

    const user = userEvent.setup()
    renderWithClient(<EventFileAttachments eventId="event-1" organizationId="org-1" />)

    const input = screen.getByLabelText("Add files", { selector: "input" })
    const file = new File(["x"], "demo.mp3", { type: "audio/mpeg" })
    await user.upload(input, file)

    expect(mutateSpy).toHaveBeenCalledWith({ eventId: "event-1", organizationId: "org-1", file })
  })

  it("shows the specific server error message when upload fails", async () => {
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: true,
      error: new Error("File is too large"),
    } as never)
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: vi.fn(),
    } as never)

    renderWithClient(<EventFileAttachments eventId="event-1" />)

    expect(await screen.findByText("File is too large")).toBeInTheDocument()
    expect(screen.queryByText("Upload failed")).not.toBeInTheDocument()
  })

  it("requests deletion via useDeleteFileMutation when confirming delete", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        { id: "file-1", originalFilename: "demo.mp3" } as fileResource.EventFile,
      ],
    } as never)
    const deleteSpy = vi.fn()
    vi.spyOn(fileResource, "useUploadFileMutation").mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
      isError: false,
    } as never)
    vi.spyOn(fileResource, "useDeleteFileMutation").mockReturnValue({
      mutate: deleteSpy,
    } as never)

    const user = userEvent.setup()
    renderWithClient(<EventFileAttachments eventId="event-1" />)

    await screen.findByText("demo.mp3")
    await user.click(screen.getByRole("button", { name: "×" }))
    await user.click(screen.getByRole("button", { name: "Delete" }))

    expect(deleteSpy).toHaveBeenCalledWith({ id: "file-1" })
  })
})
