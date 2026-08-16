import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { DeleteFileByIdCommandPort, FindFileByIdQueryPort } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export async function deleteFile(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFileByIdQuery: FindFileByIdQueryPort;
    deleteFileByIdCommand: DeleteFileByIdCommandPort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "delete" });

  const file = await deps.findFileByIdQuery(deps.db, input.scope, { id: input.id });
  if (!file) throw notFound("File");

  await deps.s3Storage.deleteObject(file.s3Key);
  await deps.deleteFileByIdCommand(deps.db, input.scope, { id: input.id });
}
