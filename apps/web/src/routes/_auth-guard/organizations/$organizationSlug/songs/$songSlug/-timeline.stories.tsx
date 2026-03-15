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
    fileId: "file-1",
    file: {
      id: "file-1",
      filename: "drums.mp3",
      storageKey: "org-1/audio-clips/file-1-drums.mp3",
      type: "audio" as const,
      organizationId: "org-1",
      createdAt: now,
    },
    durationMs: 4000 as number | null,
    startMeasure: 1,
    createdAt: now,
  },
  {
    id: "clip-2",
    trackId: "track-2",
    fileId: "file-2",
    file: {
      id: "file-2",
      filename: "bass.mp3",
      storageKey: "org-1/audio-clips/file-2-bass.mp3",
      type: "audio" as const,
      organizationId: "org-1",
      createdAt: now,
    },
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
    bpm: 120,
    onClipPositionChanged: () => {},
    onVolumeChanged: () => {},
  },
};

export const WithTracksAndClips: Story = {
  args: {
    tracks: mockTracks,
    clips: mockClips,
    bpm: 120,
    onClipPositionChanged: () => {},
    onVolumeChanged: () => {},
  },
};

export const SingleTrack: Story = {
  args: {
    tracks: [mockTracks[0]],
    clips: [mockClips[0]],
    bpm: 120,
    onClipPositionChanged: () => {},
    onVolumeChanged: () => {},
  },
};
