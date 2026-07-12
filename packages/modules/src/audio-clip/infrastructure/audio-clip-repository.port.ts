import type { KyselyDB } from "@echo/db";
import type { AudioClip } from "../domain/index.js";

export type { AudioClip };

export interface AudioClipRepoPort {
  list: (db: KyselyDB, input: { trackId: string }) => Promise<AudioClip[]>;
  listBySong: (db: KyselyDB, input: { songId: string }) => Promise<AudioClip[]>;
  findById: (db: KyselyDB, input: { clipId: string }) => Promise<AudioClip | null>;
  create: (
    db: KyselyDB,
    input: {
      id: string;
      trackId: string;
      fileId: string;
      durationMs?: number | null;
      startMeasure: number;
    },
  ) => Promise<AudioClip>;
  updatePosition: (
    db: KyselyDB,
    input: { clipId: string; startMeasure: number; trackId?: string },
  ) => Promise<AudioClip>;
  delete: (db: KyselyDB, input: { clipId: string }) => Promise<void>;
  deleteMany: (db: KyselyDB, input: { clipIds: string[] }) => Promise<{ storageKey: string }[]>;
  rename: (db: KyselyDB, input: { clipId: string; name: string }) => Promise<AudioClip>;
}
