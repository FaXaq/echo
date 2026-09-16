import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";

export type FindOrphanedFilesForSongQueryInput = {
  songId: string;
};

export type FindOrphanedFilesForSongQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindOrphanedFilesForSongQueryInput,
) => Promise<FileRecord[]>;

export type FindOrphanedFilesForSongQueryPortFactory = () => FindOrphanedFilesForSongQueryPort;
