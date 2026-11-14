import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteFolderCascadeInput = {
  id: string;
};

export type DeleteFolderCascadeResult = {
  fileIds: string[];
};

export type DeleteFolderCascadeCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteFolderCascadeInput,
) => Promise<DeleteFolderCascadeResult | null>;

export type DeleteFolderCascadeCommandPortFactory = () => DeleteFolderCascadeCommandPort;
