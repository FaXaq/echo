import type { KyselyDB } from "@echo/db";
import type { UserPermissionRepoPort } from "@echo/modules/user/infrastructure";
import type { FileRecord } from "../domain/index.js";
import type { FileRepoPort } from "../infrastructure/file-repository.port.js";
import type { S3StoragePort } from "../infrastructure/s3-storage.port.js";

async function canRead(
  userPermission: UserPermissionRepoPort,
  file: FileRecord,
  userId: string,
): Promise<boolean> {
  if (file.organizationId) {
    const { success } = await userPermission.userHasPermissionInOrganization({
      organizationId: file.organizationId,
      permissions: { file: ["read"] },
    });
    return success;
  }

  if (file.uploadedBy === userId) {
    const { success } = await userPermission.userHasPermission({
      permissions: { file: ["selfRead"] },
    });
    return success;
  }

  const { success } = await userPermission.userHasPermission({
    permissions: { file: ["read"] },
  });
  return success;
}

export async function listEventFiles(
  deps: {
    db: KyselyDB;
    fileRepo: FileRepoPort;
    userPermission: UserPermissionRepoPort;
    s3Storage: S3StoragePort;
  },
  input: { eventId: string; userId: string },
): Promise<(FileRecord & { downloadUrl: string })[]> {
  const files = await deps.fileRepo.listByEvent(deps.db, input.eventId);

  const readable: (FileRecord & { downloadUrl: string })[] = [];
  for (const file of files) {
    if (await canRead(deps.userPermission, file, input.userId)) {
      const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
      readable.push({ ...file, downloadUrl: url });
    }
  }
  return readable;
}
