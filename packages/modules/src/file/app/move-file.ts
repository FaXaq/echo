import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import type {
  FindFolderByIdQueryPort,
  MoveFileToFolderCommandPort,
} from "../infrastructure/index.js";

export async function moveFile(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    moveFileToFolderCommand: MoveFileToFolderCommandPort;
  },
  input: { id: string; scope: OrganizationScope; folderId: string | null },
): Promise<FileRecord> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "update" });

  if (input.folderId !== null) {
    const folder = await deps.findFolderByIdQuery(deps.db, input.scope, { id: input.folderId });
    if (!folder) throw notFound("Folder");
  }

  const updated = await deps.moveFileToFolderCommand(deps.db, input.scope, {
    id: input.id,
    folderId: input.folderId,
  });
  if (!updated) throw notFound("File");
  return updated;
}
