import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderRecord } from "../domain/index.js";
import type {
  FindFolderByIdQueryPort,
  FindFolderByParentAndNameQueryPort,
  InsertFolderCommandPort,
} from "../infrastructure/index.js";

export async function createFolder(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    findFolderByParentAndNameQuery: FindFolderByParentAndNameQueryPort;
    insertFolderCommand: InsertFolderCommandPort;
  },
  input: { scope: OrganizationScope; parentFolderId: string | null; name: string },
): Promise<FolderRecord> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["create"] },
  });
  if (!success) throw forbidden({ entity: "Folder", action: "create" });

  if (input.parentFolderId !== null) {
    const parent = await deps.findFolderByIdQuery(deps.db, input.scope, {
      id: input.parentFolderId,
    });
    if (!parent) throw notFound("Folder");
  }

  const existing = await deps.findFolderByParentAndNameQuery(deps.db, input.scope, {
    parentFolderId: input.parentFolderId,
    name: input.name,
  });
  if (existing) throw conflict("A folder with this name already exists here");

  return deps.insertFolderCommand(deps.db, input.scope, {
    id: crypto.randomUUID(),
    parentFolderId: input.parentFolderId,
    name: input.name,
  });
}
