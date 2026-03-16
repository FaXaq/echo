import type { AudioFile } from "../audio-clip/index.ts";

export type MidiClipId = string;

export type MidiClip = {
  id: MidiClipId;
  trackId: string;
  fileId: string;
  file: AudioFile; // file.type = "midi"
  name: string | null;
  startMeasure: number;
  durationMs: number | null;
  createdAt: Date;
};
