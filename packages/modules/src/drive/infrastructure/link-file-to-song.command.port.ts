import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type LinkFileToSongInput = {
  songId: string;
  fileId: string;
  linkedBy: string;
};

export type LinkFileToSongCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: LinkFileToSongInput,
) => Promise<void>;

export type LinkFileToSongCommandPortFactory = () => LinkFileToSongCommandPort;
