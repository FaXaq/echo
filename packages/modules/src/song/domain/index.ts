export type SongId = string;

export type Song = {
  id: SongId;
  name: string;
  organizationId: string;
  bpm: number | null;
  description: string | null;
  key: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
};
