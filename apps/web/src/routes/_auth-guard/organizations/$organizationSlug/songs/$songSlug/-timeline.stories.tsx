import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "./-timeline";

const now = new Date().toISOString();

const mockTracks = [
  { id: "track-1", songId: "song-1", name: "Drums", volume: 80, order: 1, createdAt: now, updatedAt: now },
  { id: "track-2", songId: "song-1", name: "Bass", volume: 70, order: 2, createdAt: now, updatedAt: now },
];

const mockClips = [
  {
    id: "clip-1",
    trackId: "track-1",
    filename: "drums.mp3",
    storageKey: "audio-clips/clip-1/drums.mp3",
    durationMs: 4000 as number | null,
    startMeasure: 1,
    createdAt: now,
  },
  {
    id: "clip-2",
    trackId: "track-2",
    filename: "bass.mp3",
    storageKey: "audio-clips/clip-2/bass.mp3",
    durationMs: 8000 as number | null,
    startMeasure: 3,
    createdAt: now,
  },
];

const meta = {
  title: "DAW/Timeline",
  component: Timeline,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Timeline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    tracks: [],
    clips: [],
    onClipPositionChanged: () => {},
  },
};

export const WithTracksAndClips: Story = {
  args: {
    tracks: mockTracks,
    clips: mockClips,
    onClipPositionChanged: () => {},
  },
};

export const SingleTrack: Story = {
  args: {
    tracks: [mockTracks[0]],
    clips: [mockClips[0]],
    onClipPositionChanged: () => {},
  },
};
