import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";
import type {
  FindFolderByIdQueryPort,
  FindFolderByParentAndNameQueryPort,
  FindFolderDescendantIdsQueryPort,
  MoveFolderCommandPort,
} from "../infrastructure/index.js";

export async function moveFolder(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    findFolderByParentAndNameQuery: FindFolderByParentAndNameQueryPort;
    findFolderDescendantIdsQuery: FindFolderDescendantIdsQueryPort;
    moveFolderCommand: MoveFolderCommandPort;
  },
  input: { id: string; scope: OrganizationScope; parentFolderId: string | null },
): Promise<FolderRecord> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Folder", action: "update" });

  const folder = await deps.findFolderByIdQuery(deps.db, input.scope, { id: input.id });
  if (!folder) throw notFound("Folder");

  if (input.parentFolderId === input.id) {
    throw conflict("A folder cannot be moved into itself");
  }

  if (input.parentFolderId !== null) {
    const targetParent = await deps.findFolderByIdQuery(deps.db, input.scope, {
      id: input.parentFolderId,
    });
    if (!targetParent) throw notFound("Folder");

    const descendantIds = await deps.findFolderDescendantIdsQuery(deps.db, input.scope, {
      id: input.id,
    });
    if (descendantIds.includes(input.parentFolderId)) {
      throw conflict("A folder cannot be moved into one of its own subfolders");
    }
  }

  const existing = await deps.findFolderByParentAndNameQuery(deps.db, input.scope, {
    parentFolderId: input.parentFolderId,
    name: folder.name,
  });
  if (existing && existing.id !== folder.id) {
    throw conflict("A folder with this name already exists in the destination");
  }

  const updated = await deps.moveFolderCommand(deps.db, input.scope, {
    id: input.id,
    parentFolderId: input.parentFolderId,
  });
  if (!updated) throw notFound("Folder");
  return updated;
}
