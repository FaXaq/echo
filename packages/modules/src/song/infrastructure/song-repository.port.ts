import type { KyselyDB } from "@echo/db";
import type { Song } from "../domain/index.js";

export type { Song };

export interface SongRepoPort {
  list: (db: KyselyDB, input: { organizationId: string }) => Promise<Song[]>;
  create: (
    db: KyselyDB,
    input: {
      id: string;
      name: string;
      organizationId: string;
      createdBy: string;
      key?: string | null;
    },
  ) => Promise<Song>;
  get: (db: KyselyDB, input: { songId: string }) => Promise<Song | null>;
  update: (
    db: KyselyDB,
    input: { songId: string; bpm?: number; key?: string | null },
  ) => Promise<Song>;
}
