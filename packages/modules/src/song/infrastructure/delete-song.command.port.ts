import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteSongInput = { id: string };

export type DeleteSongCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteSongInput,
) => Promise<boolean>;

export type DeleteSongCommandPortFactory = () => DeleteSongCommandPort;
