import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type {
  DriveLocation,
  FileRecord,
  FolderWithSize,
  SystemFolderEntry,
} from "../domain/index.js";

export type DriveSortField = "name" | "updatedAt" | "sizeBytes";
export type DriveSortOrder = "asc" | "desc";

export type ListFolderContentsQueryInput = {
  location: DriveLocation;
  sort: { field: DriveSortField; order: DriveSortOrder };
};

export type ListFolderContentsResult = {
  folders: FolderWithSize[];
  systemFolders: SystemFolderEntry[];
  files: FileRecord[];
};

export type ListFolderContentsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListFolderContentsQueryInput,
) => Promise<ListFolderContentsResult>;

export type ListFolderContentsQueryPortFactory = () => ListFolderContentsQueryPort;
