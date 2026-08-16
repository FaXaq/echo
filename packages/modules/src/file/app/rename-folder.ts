import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";
import type {
  FindFolderByIdQueryPort,
  FindFolderByParentAndNameQueryPort,
  RenameFolderByIdCommandPort,
} from "../infrastructure/index.js";

export async function renameFolder(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    findFolderByParentAndNameQuery: FindFolderByParentAndNameQueryPort;
    renameFolderByIdCommand: RenameFolderByIdCommandPort;
  },
  input: { id: string; scope: OrganizationScope; name: string },
): Promise<FolderRecord> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Folder", action: "update" });

  const folder = await deps.findFolderByIdQuery(deps.db, input.scope, { id: input.id });
  if (!folder) throw notFound("Folder");

  const existing = await deps.findFolderByParentAndNameQuery(deps.db, input.scope, {
    parentFolderId: folder.parentFolderId,
    name: input.name,
  });
  if (existing && existing.id !== folder.id) {
    throw conflict("A folder with this name already exists here");
  }

  const updated = await deps.renameFolderByIdCommand(deps.db, input.scope, {
    id: input.id,
    name: input.name,
  });
  if (!updated) throw notFound("Folder");
  return updated;
}
