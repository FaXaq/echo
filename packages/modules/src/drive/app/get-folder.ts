import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";
import type { FindFolderByIdQueryPort } from "../infrastructure/index.js";

export async function getFolder(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<FolderRecord> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Folder", action: "read" });

  const folder = await deps.findFolderByIdQuery(deps.db, input.scope, { id: input.id });
  if (!folder) throw notFound("Folder");
  return folder;
}
