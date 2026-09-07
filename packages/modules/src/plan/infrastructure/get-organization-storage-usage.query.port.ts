import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type GetOrganizationStorageUsageQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<number>;

export type GetOrganizationStorageUsageQueryPortFactory =
  () => GetOrganizationStorageUsageQueryPort;
