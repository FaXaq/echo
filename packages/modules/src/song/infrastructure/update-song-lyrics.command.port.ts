import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song } from "../domain/index.js";

export type UpdateSongLyricsInput = {
  id: string;
  userId: string;
  lyrics: string | null;
};

export type UpdateSongLyricsCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdateSongLyricsInput,
) => Promise<Song | null>;

export type UpdateSongLyricsCommandPortFactory = () => UpdateSongLyricsCommandPort;
