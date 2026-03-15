export type AudioClipId = string;

export type AudioClip = {
  id: AudioClipId;
  trackId: string;
  filename: string;
  storageKey: string;
  durationMs: number | null;
  startMeasure: number;
  createdAt: Date;
};
