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
  create: (input: CreateMidiClipInput) => Promise<MidiClip>;
  updatePosition: (input: { clipId: string; startMeasure: number }) => Promise<MidiClip>;
  rename: (input: { clipId: string; name: string }) => Promise<MidiClip>;
  delete: (input: { clipId: string }) => Promise<void>;
}

export type { MidiClip };
