import type { Meta, StoryObj } from "@storybook/react"
import { AudioPlayer } from "./audio-player"

function fakePeakData(length = 4410): Float32Array {
  const data = new Float32Array(length)
  for (let i = 0; i < length; i++) {
    data[i] = Math.sin(i / 40) * (0.3 + 0.7 * Math.abs(Math.sin(i / 4000)))
  }
  return data
}

if (typeof window !== "undefined") {
  window.fetch = (async () => ({
    ok: true,
    arrayBuffer: async () => new ArrayBuffer(8),
  })) as unknown as typeof fetch

  class MockAudioContext {
    decodeAudioData() {
      return Promise.resolve({
        getChannelData: () => fakePeakData(),
        numberOfChannels: 1,
      } as unknown as AudioBuffer)
    }
    close() {
      return Promise.resolve()
    }
  }
  window.AudioContext = MockAudioContext as unknown as typeof AudioContext
  URL.createObjectURL = () => "blob:mock"
  URL.revokeObjectURL = () => {}
}

const meta = {
  title: "UI/AudioPlayer",
  component: AudioPlayer,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="w-96">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AudioPlayer>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { src: "https://example.com/demo.mp3", filename: "demo.mp3" },
}
