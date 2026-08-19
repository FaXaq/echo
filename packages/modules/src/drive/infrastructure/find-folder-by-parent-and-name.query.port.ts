import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";

export type FindFolderByParentAndNameQueryInput = {
  parentFolderId: string | null;
  name: string;
};

export type FindFolderByParentAndNameQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindFolderByParentAndNameQueryInput,
) => Promise<FolderRecord | null>;

export type FindFolderByParentAndNameQueryPortFactory = () => FindFolderByParentAndNameQueryPort;
