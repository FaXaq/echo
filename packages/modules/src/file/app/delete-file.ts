import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { UserPermissionRepoPort } from "@echo/modules/user/infrastructure";
import type { FileRepoPort } from "../infrastructure/file-repository.port.js";
import type { S3StoragePort } from "../infrastructure/s3-storage.port.js";

export async function deleteFile(
  deps: {
    db: KyselyDB;
    fileRepo: FileRepoPort;
    s3Storage: S3StoragePort;
    userPermission: UserPermissionRepoPort;
  },
  input: { id: string; userId: string },
): Promise<void> {
  const file = await deps.fileRepo.findById(deps.db, input.id);
  if (!file) throw notFound("File");

  const isOwner = file.uploadedBy === input.userId;

  if (file.organizationId) {
    if (!isOwner) {
      const { success } = await deps.userPermission.userHasPermissionInOrganization({
        organizationId: file.organizationId,
        permissions: { file: ["delete"] },
      });
      if (!success) throw forbidden({ entity: "File", action: "delete" });
    }
  } else if (isOwner) {
    const { success } = await deps.userPermission.userHasPermission({
      permissions: { file: ["selfDelete"] },
    });
    if (!success) throw forbidden({ entity: "File", action: "delete" });
  } else {
    const { success } = await deps.userPermission.userHasPermission({
      permissions: { file: ["delete"] },
    });
    if (!success) throw forbidden({ entity: "File", action: "delete" });
  }

  await deps.s3Storage.deleteObject(file.s3Key);
  await deps.fileRepo.deleteById(deps.db, input.id);
}
