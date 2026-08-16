import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";

export type InsertFolderInput = {
  id: string;
  parentFolderId: string | null;
  name: string;
};

export type InsertFolderCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertFolderInput,
) => Promise<FolderRecord>;

export type InsertFolderCommandPortFactory = () => InsertFolderCommandPort;
