import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type FindFolderDescendantIdsQueryInput = {
  id: string;
};

export type FindFolderDescendantIdsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: FindFolderDescendantIdsQueryInput,
) => Promise<string[]>;

export type FindFolderDescendantIdsQueryPortFactory = () => FindFolderDescendantIdsQueryPort;
