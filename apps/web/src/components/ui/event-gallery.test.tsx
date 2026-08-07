import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"
import { EventGallery } from "./event-gallery"
import type { EventFile } from "@/services/resources/file"

function makeFile(overrides: Partial<EventFile> = {}): EventFile {
  return {
    id: "f1",
    kind: "image",
    originalFilename: "cover.png",
    downloadUrl: "https://example.com/cover.png",
    sizeBytes: 1024,
    mimeType: "image/png",
    uploadedByName: "Jane",
    ...overrides,
  } as EventFile
}

describe("EventGallery", () => {
  it("renders a thumbnail for both image and video files", () => {
    render(
      <EventGallery
        files={[makeFile(), makeFile({ id: "f2", kind: "video", originalFilename: "clip.mp4" })]}
      />
    )

    expect(screen.getByText("cover.png")).toBeInTheDocument()
    expect(screen.getByText("clip.mp4")).toBeInTheDocument()
  })

  it("opens the lightbox when a thumbnail is clicked", async () => {
    const user = userEvent.setup()
    render(<EventGallery files={[makeFile()]} />)

    await user.click(screen.getByRole("button", { name: "Open cover.png" }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("renders a working download link for each file", () => {
    render(<EventGallery files={[makeFile()]} />)

    const link = screen.getByRole("link", { name: "Download cover.png" })
    expect(link).toHaveAttribute("href", "https://example.com/cover.png")
  })
})
