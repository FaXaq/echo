import { z } from "zod";

export const fileTypeSchema = z.enum(["audio"]);
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
  durationMs: number | null;
  startMeasure: number;
  createdAt: Date;
};
