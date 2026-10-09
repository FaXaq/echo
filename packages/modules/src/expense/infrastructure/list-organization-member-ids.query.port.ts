import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type ListOrganizationMemberIdsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<string[]>;

export type ListOrganizationMemberIdsQueryPortFactory = () => ListOrganizationMemberIdsQueryPort;
