export type TrackId = string;

export type Track = {
  id: TrackId;
  songId: string;
  name: string;
  volume: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
};
