import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type {
  FindFolderPathQueryPort,
  FindFoldersByIdsQueryPort,
  FindFoldersByParentAndNamesQueryPort,
  MoveFoldersCommandPort,
} from "../infrastructure/index.js";

export async function moveFolders(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFoldersByIdsQuery: FindFoldersByIdsQueryPort;
    findFolderPathQuery: FindFolderPathQueryPort;
    findFoldersByParentAndNamesQuery: FindFoldersByParentAndNamesQueryPort;
    moveFoldersCommand: MoveFoldersCommandPort;
  },
  input: { ids: string[]; scope: OrganizationScope; parentFolderId: string | null },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Folder", action: "update" });

  const ids = [...new Set(input.ids)];
  const folders = await deps.findFoldersByIdsQuery(deps.db, input.scope, { ids });
  if (folders.length !== ids.length) throw notFound("Folder");

  if (input.parentFolderId !== null) {
    if (ids.includes(input.parentFolderId)) {
      throw conflict("A folder cannot be moved into itself");
    }
    const targetPath = await deps.findFolderPathQuery(deps.db, input.scope, {
      id: input.parentFolderId,
    });
    if (targetPath.length === 0) throw notFound("Folder");
    if (targetPath.some((segment) => ids.includes(segment.id))) {
      throw conflict("A folder cannot be moved into one of its own subfolders");
    }
  }

  const names = folders.map((folder) => folder.name);
  const clashes = await deps.findFoldersByParentAndNamesQuery(deps.db, input.scope, {
    parentFolderId: input.parentFolderId,
    names,
  });
  const lowerNames = new Set(names.map((name) => name.toLowerCase()));
  if (lowerNames.size !== names.length || clashes.some((clash) => !ids.includes(clash.id))) {
    throw conflict("A folder with this name already exists in the destination");
  }

  await deps.moveFoldersCommand(deps.db, input.scope, {
    ids,
    parentFolderId: input.parentFolderId,
  });
}
