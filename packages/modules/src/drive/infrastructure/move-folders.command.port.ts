import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type MoveFoldersInput = {
  ids: string[];
  parentFolderId: string | null;
};

export type MoveFoldersCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: MoveFoldersInput,
) => Promise<void>;

export type MoveFoldersCommandPortFactory = () => MoveFoldersCommandPort;
