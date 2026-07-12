import type { AudioFile } from "../../file/domain";

export type AudioClipId = string;

export type AudioClip = {
  id: AudioClipId;
  trackId: string;
  fileId: string;
  file: AudioFile;
  name: string | null;
  durationMs: number | null;
  startMeasure: number;
  createdAt: Date;
};
