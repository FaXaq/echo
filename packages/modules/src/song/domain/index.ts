import { z } from "zod";
import type { SongFileRecord } from "@echo/modules/drive/domain";

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

export function selectDefaultSongFile(files: SongFileRecord[]): SongFileRecord | null {
  return (
    files.find((file) => file.role === "final") ??
    files.find((file) => file.role === "demo") ??
    null
  );
}
