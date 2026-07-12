import type { KyselyDB } from "@echo/db";
import type { SongSectionInstance, SongSectionInstanceWithDefinition } from "../domain/index.js";

export type { SongSectionInstance, SongSectionInstanceWithDefinition };

export interface SongSectionInstanceRepoPort {
  create: (
    db: KyselyDB,
    input: {
      id: string;
      songId: string;
      definitionId: string;
      startMeasure: number;
      lengthMeasures: number;
      lyricsOverride?: string | null;
    },
  ) => Promise<SongSectionInstance>;
  update: (
    db: KyselyDB,
    input: {
      id: string;
      startMeasure?: number;
      lengthMeasures?: number;
      lyricsOverride?: string | null;
      repeat?: number;
    },
  ) => Promise<SongSectionInstance>;
  delete: (db: KyselyDB, input: { id: string }) => Promise<void>;
  list: (db: KyselyDB, input: { songId: string }) => Promise<SongSectionInstanceWithDefinition[]>;
  get: (db: KyselyDB, input: { id: string }) => Promise<SongSectionInstance | null>;
  getLastStartMeasure: (
    db: KyselyDB,
    input: { songId: string },
  ) => Promise<{ startMeasure: number; lengthMeasures: number } | null>;
  updateStartMeasures: (
    db: KyselyDB,
    input: { updates: Array<{ id: string; startMeasure: number }> },
  ) => Promise<void>;
}
