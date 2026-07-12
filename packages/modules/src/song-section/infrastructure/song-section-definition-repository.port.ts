import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinition, SongChord } from "../domain/index.js";

export type { SongSectionDefinition, SongChord };

export interface SongSectionDefinitionRepoPort {
  create: (
    db: KyselyDB,
    input: {
      id: string;
      songId: string;
      name: string;
      chords: SongChord[];
      lyrics?: string | null;
      color?: string | null;
      repeat?: number;
    },
  ) => Promise<SongSectionDefinition>;
  update: (
    db: KyselyDB,
    input: {
      id: string;
      name?: string;
      chords?: SongChord[];
      lyrics?: string | null;
      color?: string | null;
      repeat?: number;
    },
  ) => Promise<SongSectionDefinition>;
  delete: (db: KyselyDB, input: { id: string }) => Promise<void>;
  list: (db: KyselyDB, input: { songId: string }) => Promise<SongSectionDefinition[]>;
  get: (db: KyselyDB, input: { id: string }) => Promise<SongSectionDefinition | null>;
}
