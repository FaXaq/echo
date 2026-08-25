import { z } from "zod";

export const songTypeSchema = z.enum(["original", "cover"]);
export type SongType = z.infer<typeof songTypeSchema>;

export type Song = {
  id: string;
  title: string;
  artist: string | null;
  bpm: number | null;
  key: string | null;
  lyrics: string | null;
  type: SongType | null;
  organization: {
    id: string;
    name: string;
    slug: string;
  };
  createdAt: Date;
  createdBy: string;
  createdByName: string;
  updatedBy: string | null;
  updatedAt: Date | null;
};
