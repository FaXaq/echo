import type { KyselyDB } from "@echo/db";
import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import type { FileRecord } from "../domain/index.js";
import { listFilesByEvent } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

async function canRead(
  deps: {
    userHasPermission: CheckUserPermission;
    userHasPermissionInOrganization: CheckOrganizationPermission;
  },
  file: FileRecord,
  userId: string,
): Promise<boolean> {
  if (file.organizationId) {
    const { success } = await deps.userHasPermissionInOrganization({
      organizationId: file.organizationId,
      permissions: { file: ["read"] },
    });
    return success;
  }

  if (file.uploadedBy === userId) {
    const { success } = await deps.userHasPermission({
      permissions: { file: ["selfRead"] },
    });
    return success;
  }

  const { success } = await deps.userHasPermission({
    permissions: { file: ["read"] },
  });
  return success;
}

export async function listEventFiles(
  deps: {
    db: KyselyDB;
    userHasPermission: CheckUserPermission;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    s3Storage: S3StoragePort;
  },
  input: { eventId: string; userId: string },
): Promise<(FileRecord & { downloadUrl: string })[]> {
  const files = await listFilesByEvent(deps.db, input.eventId);

  const readable: (FileRecord & { downloadUrl: string })[] = [];
  for (const file of files) {
    if (await canRead(deps, file, input.userId)) {
      const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
      readable.push({ ...file, downloadUrl: url });
    }
  }
  return readable;
}
