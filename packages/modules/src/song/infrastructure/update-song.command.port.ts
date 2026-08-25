import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song, SongType } from "../domain/index.js";

export type UpdateSongInput = {
  id: string;
  userId: string;
  title: string;
  artist: string | null;
  bpm: number | null;
  key: string | null;
  type: SongType | null;
};

export type UpdateSongCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdateSongInput,
) => Promise<Song | null>;

export type UpdateSongCommandPortFactory = () => UpdateSongCommandPort;
