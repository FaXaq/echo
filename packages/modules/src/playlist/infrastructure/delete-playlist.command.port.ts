import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeletePlaylistInput = { id: string };

export type DeletePlaylistCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeletePlaylistInput,
) => Promise<boolean>;

export type DeletePlaylistCommandPortFactory = () => DeletePlaylistCommandPort;
