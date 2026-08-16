import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { DeleteFolderCascadeCommandPort } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export type DeleteFolderFailure = { fileId: string; error: unknown };

export async function deleteFolder(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteFolderCascadeCommand: DeleteFolderCascadeCommandPort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<DeleteFolderFailure[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "Folder", action: "delete" });

  const result = await deps.deleteFolderCascadeCommand(deps.db, input.scope, { id: input.id });
  if (!result) throw notFound("Folder");

  const settled = await Promise.allSettled(
    result.deletedFiles.map((file) => deps.s3Storage.deleteObject(file.s3Key)),
  );

  return settled.flatMap((outcome, index) =>
    outcome.status === "rejected"
      ? [{ fileId: result.deletedFiles[index]!.id, error: outcome.reason }]
      : [],
  );
}
