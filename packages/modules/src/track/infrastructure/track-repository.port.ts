import type { KyselyDB } from "@echo/db";
import type { Track } from "../domain/index.js";

export type { Track };

export interface TrackRepoPort {
  list: (db: KyselyDB, input: { songId: string }) => Promise<Track[]>;
  findById: (db: KyselyDB, input: { trackId: string }) => Promise<Track | null>;
  create: (
    db: KyselyDB,
    input: { id: string; songId: string; name: string; volume: number; order: number },
  ) => Promise<Track>;
  updateVolume: (db: KyselyDB, input: { trackId: string; volumeDb: number }) => Promise<Track>;
  setInstrumentPreset: (
    db: KyselyDB,
    input: { trackId: string; preset: number | null },
  ) => Promise<Track>;
  delete: (db: KyselyDB, input: { trackId: string }) => Promise<void>;
  rename: (db: KyselyDB, input: { trackId: string; name: string }) => Promise<Track>;
  reorder: (db: KyselyDB, input: { orderedTrackIds: string[] }) => Promise<void>;
}
