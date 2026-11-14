import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord, FolderPlace } from "../domain/index.js";

export type MoveFileToFolderInput = {
  id: string;
  from: FolderPlace;
  folderId: string | null;
};

export type MoveFileToFolderCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: MoveFileToFolderInput,
) => Promise<FileRecord | null>;

export type MoveFileToFolderCommandPortFactory = () => MoveFileToFolderCommandPort;
