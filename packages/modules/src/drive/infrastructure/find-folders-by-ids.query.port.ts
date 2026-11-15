import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";

export type FindFoldersByIdsQueryInput = { ids: string[] };

export type FindFoldersByIdsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindFoldersByIdsQueryInput,
) => Promise<FolderRecord[]>;

export type FindFoldersByIdsQueryPortFactory = () => FindFoldersByIdsQueryPort;
