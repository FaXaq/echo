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
  updateVolume: (input: { trackId: string; volume: number }) => Promise<Track>;
  delete: (input: { trackId: string }) => Promise<void>;
}

export type { Track };
