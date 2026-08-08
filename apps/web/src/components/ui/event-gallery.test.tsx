import { fireEvent, render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"
import { EventGallery } from "./event-gallery"
import type { EventFile } from "@/services/resources/file"

function makeFile(overrides: Partial<EventFile> = {}): EventFile {
  return {
    id: "f1",
    kind: "image",
    originalFilename: "cover.png",
    filename: "cover.png",
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
        files={[makeFile(), makeFile({ id: "f2", kind: "video", originalFilename: "clip.mp4", filename: "clip.mp4" })]}
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

  it("opens the correct file when files contains non-gallery kinds interleaved with images", async () => {
    const user = userEvent.setup()
    const first = makeFile({ id: "f1", originalFilename: "first.png", filename: "first.png", downloadUrl: "https://example.com/first.png" })
    const audio = makeFile({
      id: "f2",
      kind: "audio",
      originalFilename: "voice.mp3",
      filename: "voice.mp3",
      downloadUrl: "https://example.com/voice.mp3",
    })
    const second = makeFile({ id: "f3", originalFilename: "second.png", filename: "second.png", downloadUrl: "https://example.com/second.png" })

    render(<EventGallery files={[first, audio, second]} />)

    await user.click(screen.getByRole("button", { name: "Open second.png" }))

    const dialog = await screen.findByRole("dialog")
    const image = dialog.querySelector("img")
    expect(image).toHaveAttribute("src", "https://example.com/second.png")
  })

  it("shows an error state on the thumbnail and in the lightbox when an image fails to load", async () => {
    const user = userEvent.setup()
    render(<EventGallery files={[makeFile()]} />)

    const img = document.querySelector("img") as HTMLImageElement
    fireEvent.error(img)

    expect(await screen.findAllByText("Couldn't load this file")).not.toHaveLength(0)

    await user.click(screen.getByRole("button", { name: "Open cover.png" }))

    const dialog = await screen.findByRole("dialog")
    expect(dialog.querySelector("img")).not.toBeInTheDocument()
  })
})
