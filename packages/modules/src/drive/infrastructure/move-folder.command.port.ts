import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";

export type MoveFolderInput = {
  id: string;
  parentFolderId: string | null;
};

export type MoveFolderCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: MoveFolderInput,
) => Promise<FolderRecord | null>;

export type MoveFolderCommandPortFactory = () => MoveFolderCommandPort;
