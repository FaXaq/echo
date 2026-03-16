import type { Track } from "@echo/domain";

export interface TrackRepoPort {
  list: (input: { songId: string }) => Promise<Track[]>;
  create: (input: {
    id: string;
    songId: string;
    name: string;
    volume: number;
    order: number;
  }) => Promise<Track>;
  updateVolume: (input: { trackId: string; volumeDb: number }) => Promise<Track>;
  setInstrumentPreset: (input: { trackId: string; preset: number | null }) => Promise<Track>;
  delete: (input: { trackId: string }) => Promise<void>;
  rename: (input: { trackId: string; name: string }) => Promise<Track>;
}

export type { Track };
