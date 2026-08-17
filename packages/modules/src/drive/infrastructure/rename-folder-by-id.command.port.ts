import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";

export type RenameFolderByIdInput = {
  id: string;
  name: string;
};

export type RenameFolderByIdCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: RenameFolderByIdInput,
) => Promise<FolderRecord | null>;

export type RenameFolderByIdCommandPortFactory = () => RenameFolderByIdCommandPort;
