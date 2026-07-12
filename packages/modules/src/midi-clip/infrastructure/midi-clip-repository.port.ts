import type { KyselyDB } from "@echo/db";
import type { MidiClip } from "../domain/index.js";

export type { MidiClip };

export type CreateMidiClipInput = {
  id: string;
  trackId: string;
  fileId: string;
  startMeasure: number;
  durationMs: number | null;
};

export interface MidiClipRepoPort {
  listBySong: (db: KyselyDB, input: { songId: string }) => Promise<MidiClip[]>;
  findById: (db: KyselyDB, input: { clipId: string }) => Promise<MidiClip | null>;
  create: (db: KyselyDB, input: CreateMidiClipInput) => Promise<MidiClip>;
  updatePosition: (
    db: KyselyDB,
    input: { clipId: string; startMeasure: number; trackId?: string },
  ) => Promise<MidiClip>;
  rename: (db: KyselyDB, input: { clipId: string; name: string }) => Promise<MidiClip>;
  delete: (db: KyselyDB, input: { clipId: string }) => Promise<void>;
  deleteMany: (db: KyselyDB, input: { clipIds: string[] }) => Promise<void>;
}
