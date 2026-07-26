import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { EventAttachments } from "./event-attachments"
import * as fileResource from "@/services/resources/file"

vi.mock("@/components/ui/audio-player", () => ({
  AudioPlayer: ({ filename }: { filename: string }) => <div>Player: {filename}</div>,
}))

vi.mock("@/components/ui/event-gallery", () => ({
  EventGallery: ({ files }: { files: fileResource.EventFile[] }) => (
    <div>Gallery: {files.map((file) => file.originalFilename).join(", ")}</div>
  ),
}))

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe("EventAttachments", () => {
  beforeEach(() => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [],
    } as never)
  })

  it("renders nothing when there are no files", () => {
    const { container } = renderWithClient(<EventAttachments eventId="event-1" />)
    expect(container).toBeEmptyDOMElement()
  })

  it("renders an AudioPlayer for audio files", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-1",
          kind: "audio",
          originalFilename: "demo.mp3",
          downloadUrl: "https://example.com/demo.mp3",
        } as fileResource.EventFile,
      ],
    } as never)

    renderWithClient(<EventAttachments eventId="event-1" />)
    expect(await screen.findByText("Player: demo.mp3")).toBeInTheDocument()
  })

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
    } as never)

    renderWithClient(<EventAttachments eventId="event-1" />)
    expect(await screen.findByText("Gallery: cover.png, clip.mp4")).toBeInTheDocument()
    expect(screen.queryByText(/^Player:/)).not.toBeInTheDocument()
  })

  it("renders both sections when audio and image files are mixed", async () => {
    vi.spyOn(fileResource, "getEventFilesQueryOptions").mockReturnValue({
      queryKey: ["file", "listEventFiles"],
      queryFn: async () => [
        {
          id: "file-1",
          kind: "audio",
          originalFilename: "demo.mp3",
          downloadUrl: "https://example.com/demo.mp3",
        } as fileResource.EventFile,
        {
          id: "file-2",
          kind: "image",
          originalFilename: "cover.png",
          downloadUrl: "https://example.com/cover.png",
        } as fileResource.EventFile,
      ],
    } as never)

    renderWithClient(<EventAttachments eventId="event-1" />)
    expect(await screen.findByText("Player: demo.mp3")).toBeInTheDocument()
    expect(await screen.findByText("Gallery: cover.png")).toBeInTheDocument()
  })
})
