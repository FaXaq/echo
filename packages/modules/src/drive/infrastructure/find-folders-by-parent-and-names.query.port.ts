import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";

export type FindFoldersByParentAndNamesQueryInput = {
  parentFolderId: string | null;
  names: string[];
};

export type FindFoldersByParentAndNamesQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindFoldersByParentAndNamesQueryInput,
) => Promise<FolderRecord[]>;

export type FindFoldersByParentAndNamesQueryPortFactory =
  () => FindFoldersByParentAndNamesQueryPort;
