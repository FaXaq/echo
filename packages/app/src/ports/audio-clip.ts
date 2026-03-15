import type { AudioClip } from "@echo/domain";

export interface AudioClipRepoPort {
  list: (input: { trackId: string }) => Promise<AudioClip[]>;
  listBySong: (input: { songId: string }) => Promise<AudioClip[]>;
  findById: (input: { clipId: string }) => Promise<AudioClip | null>;
  create: (input: {
    id: string;
    trackId: string;
    fileId: string;
    durationMs?: number | null;
    startMeasure: number;
  }) => Promise<AudioClip>;
  updatePosition: (input: {
    clipId: string;
    startMeasure: number;
  }) => Promise<AudioClip>;
  delete: (input: { clipId: string }) => Promise<void>;
}

export type { AudioClip };
