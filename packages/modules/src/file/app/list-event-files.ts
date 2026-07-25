import type { KyselyDB } from "@echo/db";
import type { UserPermissionRepoPort } from "@echo/modules/user/infrastructure";
import type { FileRecord } from "../domain/index.js";
import type { FileRepoPort } from "../infrastructure/file-repository.port.js";

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
  deps: { db: KyselyDB; fileRepo: FileRepoPort; userPermission: UserPermissionRepoPort },
  input: { eventId: string; userId: string },
): Promise<FileRecord[]> {
  const files = await deps.fileRepo.listByEvent(deps.db, input.eventId);

  const readable: FileRecord[] = [];
  for (const file of files) {
    if (await canRead(deps.userPermission, file, input.userId)) {
      readable.push(file);
    }
  }
  return readable;
}
