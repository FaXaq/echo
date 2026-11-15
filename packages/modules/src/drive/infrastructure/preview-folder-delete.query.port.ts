import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type PreviewFolderDeleteQueryInput = { id: string };

export type PreviewFolderDeleteResult = { deletedCount: number; keptCount: number };

export type PreviewFolderDeleteQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: PreviewFolderDeleteQueryInput,
) => Promise<PreviewFolderDeleteResult>;

export type PreviewFolderDeleteQueryPortFactory = () => PreviewFolderDeleteQueryPort;
