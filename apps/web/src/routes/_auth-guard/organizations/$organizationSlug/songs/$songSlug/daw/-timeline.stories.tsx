import type { Meta, StoryObj } from "@storybook/react";
import { Timeline } from "./-timeline";

const now = new Date().toISOString();

const mockTracks = [
  { id: "track-1", songId: "song-1", name: "Drums", volume: 0, instrumentPreset: null as number | null, order: 1, createdAt: now, updatedAt: now },
  { id: "track-2", songId: "song-1", name: "Bass", volume: -6, instrumentPreset: null as number | null, order: 2, createdAt: now, updatedAt: now },
];

const mockClips = [
  {
    id: "clip-1",
    trackId: "track-1",
    fileId: "file-1",
    name: null as string | null,
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
    name: null as string | null,
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

const sharedArgs = {
  bpm: 120,
  playbackPosition: 0,
  isPlaying: false,
  organizationId: "org-1",
  editingTrackId: null,
  downloadUrls: new Map<string, string>(),
  midiClips: [],
  onClipPositionChanged: () => {},
  onMidiClipPositionChanged: () => {},
  onVolumeChanged: () => {},
  onTrackDeleted: () => {},
  onClipUploaded: () => {},
  onMidiClipUploaded: () => {},
  onClipDeleted: () => {},
  onMidiClipDeleted: () => {},
  onClipRenamed: () => {},
  onEditingTrackIdChange: () => {},
  onTrackRenamed: () => {},
  onAddTrack: () => {},
};

export const Empty: Story = {
  args: {
    ...sharedArgs,
    tracks: [],
    clips: [],
  },
};

export const WithTracksAndClips: Story = {
  args: {
    ...sharedArgs,
    tracks: mockTracks,
    clips: mockClips,
  },
};

export const SingleTrack: Story = {
  args: {
    ...sharedArgs,
    tracks: [mockTracks[0]],
    clips: [mockClips[0]],
  },
};
