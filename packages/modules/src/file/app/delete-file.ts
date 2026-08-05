import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import { deleteFileById, findFileById } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export async function deleteFile(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermission: CheckUserPermission;
    userHasPermissionInOrganization: CheckOrganizationPermission;
  },
  input: { id: string; userId: string },
): Promise<void> {
  const file = await findFileById(deps.db, input.id);
  if (!file) throw notFound("File");

  const isOwner = file.uploadedBy === input.userId;

  if (file.organizationId) {
    if (!isOwner) {
      const { success } = await deps.userHasPermissionInOrganization({
        organizationId: file.organizationId,
        permissions: { file: ["delete"] },
      });
      if (!success) throw forbidden({ entity: "File", action: "delete" });
    }
  } else if (isOwner) {
    const { success } = await deps.userHasPermission({
      permissions: { file: ["selfDelete"] },
    });
    if (!success) throw forbidden({ entity: "File", action: "delete" });
  } else {
    const { success } = await deps.userHasPermission({
      permissions: { file: ["delete"] },
    });
    if (!success) throw forbidden({ entity: "File", action: "delete" });
  }

  await deps.s3Storage.deleteObject(file.s3Key);
  await deleteFileById(deps.db, input.id);
}
