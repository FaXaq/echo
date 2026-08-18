import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord, FolderRecord } from "../domain/index.js";
import type { SearchDriveQueryPort } from "../infrastructure/index.js";

export async function searchDrive(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    searchDriveQuery: SearchDriveQueryPort;
  },
  input: { scope: OrganizationScope; query: string },
): Promise<{
  folders: (FolderRecord & { path: string[] })[];
  files: (FileRecord & { path: string[] })[];
}> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "read" });

  return deps.searchDriveQuery(deps.db, input.scope, { query: input.query });
}
