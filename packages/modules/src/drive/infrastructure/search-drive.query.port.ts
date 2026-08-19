import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord, FolderRecord } from "../domain/index.js";

export type SearchDriveQueryInput = { query: string };

export type SearchDriveResult = {
  folders: (FolderRecord & { path: string[] })[];
  files: (FileRecord & { path: string[] })[];
};

export type SearchDriveQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: SearchDriveQueryInput,
) => Promise<SearchDriveResult>;

export type SearchDriveQueryPortFactory = () => SearchDriveQueryPort;
