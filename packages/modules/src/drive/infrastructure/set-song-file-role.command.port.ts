import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Role } from "../domain/index.js";

export type SetSongFileRoleInput = {
  songId: string;
  fileId: string;
  role: Role;
  linkedBy: string;
};

export type SetSongFileRoleCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: SetSongFileRoleInput,
) => Promise<boolean>;

export type SetSongFileRoleCommandPortFactory = () => SetSongFileRoleCommandPort;
