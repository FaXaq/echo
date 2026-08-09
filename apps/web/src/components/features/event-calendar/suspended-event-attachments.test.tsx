import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"
import { SuspendedEventAttachments } from "./suspended-event-attachments"
import * as fileResource from "@/services/resources/file"

function renderWithFiles(files: fileResource.EventFile[]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(fileResource.getEventFilesQueryOptions({ eventId: "event-1" }).queryKey, files)
  return render(
    <QueryClientProvider client={client}>
      <SuspendedEventAttachments eventId="event-1" />
    </QueryClientProvider>
  )
}

describe("SuspendedEventAttachments", () => {
  it("shows the empty state and a zero file-count badge when there are no files", async () => {
    renderWithFiles([])
    expect(await screen.findByText("No files linked yet.")).toBeInTheDocument()
    expect(screen.getByText("0 files")).toBeInTheDocument()
  })

  it("groups files into audio, gallery, and documents sections", async () => {
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
    ])

    expect(await screen.findByText("Audio")).toBeInTheDocument()
    expect(screen.getByText("Documents")).toBeInTheDocument()
    expect(screen.getByText("Player: https://example.com/demo.mp3")).toBeInTheDocument()
    expect(screen.getByText("setlist.pdf")).toBeInTheDocument()
    expect(screen.getByText("2 files")).toBeInTheDocument()
  })
})
