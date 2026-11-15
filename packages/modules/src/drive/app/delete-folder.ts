import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type {
  DeleteFolderCascadeCommandPort,
  DeleteOrphanedFilesCommandPort,
} from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { purgeOrphanedFiles } from "./purge-orphaned-files.js";

export type DeleteFolderFailure = { fileId: string; error: unknown };

export async function deleteFolder(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteFolderCascadeCommand: DeleteFolderCascadeCommandPort;
    deleteOrphanedFilesCommand: DeleteOrphanedFilesCommandPort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<DeleteFolderFailure[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "Folder", action: "delete" });

  const result = await deps.deleteFolderCascadeCommand(deps.db, input.scope, { id: input.id });
  if (!result) throw notFound("Folder");

  const { failures } = await purgeOrphanedFiles(deps, {
    scope: input.scope,
    fileIds: result.fileIds,
  });
  return failures;
}
