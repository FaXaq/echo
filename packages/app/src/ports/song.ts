import type { Song } from "@echo/domain";

export interface SongRepoPort {
  list: (input: { organizationId: string }) => Promise<Song[]>;
  create: (input: {
    id: string;
    name: string;
    organizationId: string;
    createdBy: string;
    key?: string | null;
  }) => Promise<Song>;
  get: (input: { songId: string }) => Promise<Song | null>;
}

export type { Song }
