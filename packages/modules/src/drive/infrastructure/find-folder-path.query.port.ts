import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type FolderPathSegment = { id: string; name: string };

export type FindFolderPathQueryInput = { id: string };

export type FindFolderPathQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindFolderPathQueryInput,
) => Promise<FolderPathSegment[]>;

export type FindFolderPathQueryPortFactory = () => FindFolderPathQueryPort;
