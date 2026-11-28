import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type {
  FindFolderByIdQueryPort,
  PreviewFolderDeleteQueryPort,
  PreviewFolderDeleteResult,
} from "../infrastructure/index.js";

export async function previewFolderDelete(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    previewFolderDeleteQuery: PreviewFolderDeleteQueryPort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<PreviewFolderDeleteResult> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "Folder", action: "delete" });

  const folder = await deps.findFolderByIdQuery(deps.db, input.scope, { id: input.id });
  if (!folder) throw notFound("Folder");

  return deps.previewFolderDeleteQuery(deps.db, input.scope, { id: input.id });
}
