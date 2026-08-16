import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";

export type FindFolderByIdQueryInput = {
  id: string;
};

export type FindFolderByIdQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindFolderByIdQueryInput,
) => Promise<FolderRecord | null>;

export type FindFolderByIdQueryPortFactory = () => FindFolderByIdQueryPort;
