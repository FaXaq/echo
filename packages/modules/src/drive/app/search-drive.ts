import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { SearchDriveQueryPort, SearchDriveResult } from "../infrastructure/index.js";

export async function searchDrive(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    searchDriveQuery: SearchDriveQueryPort;
  },
  input: { scope: OrganizationScope; query: string },
): Promise<SearchDriveResult> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "read" });

  return deps.searchDriveQuery(deps.db, input.scope, { query: input.query });
}
