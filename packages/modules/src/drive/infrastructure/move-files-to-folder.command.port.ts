import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderPlace } from "../domain/index.js";

export type MoveFilesToFolderInput = {
  ids: string[];
  from: FolderPlace;
  folderId: string | null;
};

export type MoveFilesToFolderCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: MoveFilesToFolderInput,
) => Promise<boolean>;

export type MoveFilesToFolderCommandPortFactory = () => MoveFilesToFolderCommandPort;
