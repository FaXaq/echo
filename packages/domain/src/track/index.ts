export type TrackId = string;

export type Track = {
  id: TrackId;
  songId: string;
  name: string;
  volume: number; // dB scale: -60.0 to +6.0, default 0.0 (unity gain)
  instrumentPreset: number | null; // GM program 0-127, null = default (Acoustic Grand Piano)
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
