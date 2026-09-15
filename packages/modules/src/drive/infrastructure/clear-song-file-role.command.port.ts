import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type ClearSongFileRoleInput = {
  songId: string;
  fileId: string;
};

export type ClearSongFileRoleCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ClearSongFileRoleInput,
) => Promise<boolean>;

export type ClearSongFileRoleCommandPortFactory = () => ClearSongFileRoleCommandPort;
