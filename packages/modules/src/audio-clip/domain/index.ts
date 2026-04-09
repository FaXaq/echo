export type AudioClipId = string;

export type AudioClip = {
  id: AudioClipId;
  trackId: string;
  fileId: string;
  file: import("../../file/domain/index.js").AudioFile;
  name: string | null;
  durationMs: number | null;
  startMeasure: number;
  createdAt: Date;
};
