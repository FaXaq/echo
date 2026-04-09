export type MidiClipId = string;

export type MidiClip = {
  id: MidiClipId;
  trackId: string;
  fileId: string;
  file: import("../../file/domain/index.js").AudioFile; // file.type = "midi"
  name: string | null;
  startMeasure: number;
  durationMs: number | null;
  createdAt: Date;
};
