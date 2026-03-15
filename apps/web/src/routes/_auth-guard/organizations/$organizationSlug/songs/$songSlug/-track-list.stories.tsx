import type { Meta, StoryObj } from "@storybook/react";
import { TrackList } from "./-track-list";

const now = new Date().toISOString();

const mockTracks = [
  { id: "track-1", songId: "song-1", name: "Drums", volume: 80, order: 1, createdAt: now, updatedAt: now },
  { id: "track-2", songId: "song-1", name: "Bass", volume: 60, order: 2, createdAt: now, updatedAt: now },
  { id: "track-3", songId: "song-1", name: "Guitar", volume: 75, order: 3, createdAt: now, updatedAt: now },
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
  title: "DAW/TrackList",
  component: TrackList,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof TrackList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  args: {
    tracks: [],
    clips: [],
    songId: "song-1",
    onTrackDeleted: () => {},
    onVolumeChanged: () => {},
    onClipUploaded: () => {},
    onClipDeleted: () => {},
  },
};

export const WithTracks: Story = {
  args: {
    tracks: mockTracks,
    clips: mockClips,
    songId: "song-1",
    onTrackDeleted: () => {},
    onVolumeChanged: () => {},
    onClipUploaded: () => {},
    onClipDeleted: () => {},
  },
};

export const SingleTrack: Story = {
  args: {
    tracks: [mockTracks[0]],
    clips: [],
    songId: "song-1",
    onTrackDeleted: () => {},
    onVolumeChanged: () => {},
    onClipUploaded: () => {},
    onClipDeleted: () => {},
  },
};
