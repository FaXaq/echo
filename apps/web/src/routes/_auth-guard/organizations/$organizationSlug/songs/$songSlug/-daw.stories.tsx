import type { Meta, StoryObj } from "@storybook/react";
import { Daw } from "./-daw";

const now = new Date().toISOString();

const mockSong = {
  id: "song-1",
  name: "My Song",
  organizationId: "org-1",
  bpm: 120 as number | null,
  description: null as string | null,
  key: "C major" as string | null,
  createdBy: "user-1",
  createdAt: now,
  updatedAt: now,
  updatedBy: null as string | null,
};

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
];

const meta = {
  title: "DAW/Daw",
  component: Daw,
  parameters: {
    layout: "fullscreen",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof Daw>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    song: mockSong,
    initialTracks: [],
    initialClips: [],
  },
};

export const WithTracksAndClips: Story = {
  args: {
    song: mockSong,
    initialTracks: mockTracks,
    initialClips: mockClips,
  },
};

export const SongWithoutBpm: Story = {
  args: {
    song: { ...mockSong, bpm: null, key: null },
    initialTracks: mockTracks,
    initialClips: [],
  },
};
