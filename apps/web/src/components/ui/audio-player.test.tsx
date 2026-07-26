import { fireEvent, render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { AudioPlayer } from "./audio-player"

function makeFakeAudioBuffer(length = 640): AudioBuffer {
  const data = new Float32Array(length).fill(0.5)
  return {
    getChannelData: () => data,
    numberOfChannels: 1,
    length,
    duration: 10,
    sampleRate: 44100,
  } as unknown as AudioBuffer
}

class FakeAudioContext {
  decodeAudioData = vi.fn().mockResolvedValue(makeFakeAudioBuffer())
  close = vi.fn().mockResolvedValue(undefined)
}

describe("AudioPlayer", () => {
  beforeEach(() => {
    vi.stubGlobal("AudioContext", FakeAudioContext)
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      }),
    )
    URL.createObjectURL = vi.fn(() => "blob:mock-url")
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("renders waveform bars once decoding finishes", async () => {
    render(<AudioPlayer src="https://example.com/demo.mp3" filename="demo.mp3" />)
    await waitFor(() =>
      expect(screen.getByTestId("audio-player-waveform").children.length).toBeGreaterThan(0),
    )
  })

  it("toggles the play/pause button when playback starts and stops", async () => {
    const user = userEvent.setup()
    render(<AudioPlayer src="https://example.com/demo.mp3" filename="demo.mp3" />)
    await screen.findByRole("button", { name: "Play" })

    const audio = document.querySelector("audio") as HTMLAudioElement
    audio.play = vi.fn().mockImplementation(() => {
      fireEvent.play(audio)
      return Promise.resolve()
    })
    audio.pause = vi.fn().mockImplementation(() => {
      fireEvent.pause(audio)
    })

    await user.click(screen.getByRole("button", { name: "Play" }))
    expect(audio.play).toHaveBeenCalled()
    await screen.findByRole("button", { name: "Pause" })

    await user.click(screen.getByRole("button", { name: "Pause" }))
    expect(audio.pause).toHaveBeenCalled()
    await screen.findByRole("button", { name: "Play" })
  })

  it("falls back to a native audio element when the fetch fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }))
    render(<AudioPlayer src="https://example.com/demo.mp3" filename="demo.mp3" />)

    expect(await screen.findByText("Unable to preview waveform")).toBeInTheDocument()
    expect(document.querySelector("audio[controls]")).toBeInTheDocument()
  })
})
