import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FindFolderPathQueryPort, FolderPathSegment } from "../infrastructure/index.js";

export async function getFolderPath(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderPathQuery: FindFolderPathQueryPort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<FolderPathSegment[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Folder", action: "read" });

  const path = await deps.findFolderPathQuery(deps.db, input.scope, { id: input.id });
  if (path.length === 0) throw notFound("Folder");
  return path;
}
