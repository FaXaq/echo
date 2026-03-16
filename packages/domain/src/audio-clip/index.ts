import { z } from "zod";

export const fileTypeSchema = z.enum(["audio", "midi"]);
export type FileType = z.infer<typeof fileTypeSchema>;

export type AudioFileId = string;

export type AudioFile = {
  id: AudioFileId;
  storageKey: string;
  filename: string;
  type: FileType;
  organizationId: string;
  createdAt: Date;
};

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
