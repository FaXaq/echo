import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song } from "../domain/index.js";

export type GetSongByIdQueryInput = { songId: string };

export type GetSongByIdQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: GetSongByIdQueryInput,
) => Promise<Song | undefined>;

export type GetSongByIdQueryPortFactory = () => GetSongByIdQueryPort;
