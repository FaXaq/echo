import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { SongFileRecord } from "../domain/index.js";

export type ListSongAudioVersionsQueryInput = {
  songId: string;
};

export type ListSongAudioVersionsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListSongAudioVersionsQueryInput,
) => Promise<SongFileRecord[]>;

export type ListSongAudioVersionsQueryPortFactory = () => ListSongAudioVersionsQueryPort;
