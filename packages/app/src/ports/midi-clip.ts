import type { MidiClip } from "@echo/domain";

export type CreateMidiClipInput = {
  id: string;
  trackId: string;
  fileId: string;
  startMeasure: number;
  durationMs: number | null;
};

export interface MidiClipRepoPort {
  listBySong: (input: { songId: string }) => Promise<MidiClip[]>;
  findById: (input: { clipId: string }) => Promise<MidiClip | null>;
  create: (input: CreateMidiClipInput) => Promise<MidiClip>;
  updatePosition: (input: { clipId: string; startMeasure: number; trackId?: string }) => Promise<MidiClip>;
  rename: (input: { clipId: string; name: string }) => Promise<MidiClip>;
  delete: (input: { clipId: string }) => Promise<void>;
  deleteMany: (input: { clipIds: string[] }) => Promise<void>;
}

export type { MidiClip };
