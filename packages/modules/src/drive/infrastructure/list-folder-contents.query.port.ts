import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord, FolderRecord } from "../domain/index.js";

export type ListFolderContentsQueryInput = {
  folderId: string | null;
};

export type ListFolderContentsResult = {
  folders: FolderRecord[];
  files: FileRecord[];
};

export type ListFolderContentsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListFolderContentsQueryInput,
) => Promise<ListFolderContentsResult>;

export type ListFolderContentsQueryPortFactory = () => ListFolderContentsQueryPort;
