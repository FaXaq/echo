import type { KyselyDB } from "@echo/db";
import { conflict, forbidden } from "@echo/errors";
import type { UserPermissionRepoPort } from "@echo/modules/user/infrastructure";
import { isValidFileSize, kindForMimeType } from "../domain/index.js";
import type { FileRepoPort } from "../infrastructure/file-repository.port.js";
import type { S3StoragePort } from "../infrastructure/s3-storage.port.js";

export async function createUpload(
  deps: {
    db: KyselyDB;
    fileRepo: FileRepoPort;
    s3Storage: S3StoragePort;
    userPermission: UserPermissionRepoPort;
  },
  input: {
    userId: string;
    eventId?: string;
    organizationId?: string;
    mimeType: string;
    sizeBytes: number;
    filename: string;
  },
): Promise<{ fileId: string; uploadUrl: string }> {
  const kind = kindForMimeType(input.mimeType);
  if (!kind) throw conflict("Unsupported file type");
  if (!isValidFileSize(input.sizeBytes)) throw conflict("File is too large");

  if (input.organizationId) {
    const { success } = await deps.userPermission.userHasPermissionInOrganization({
      organizationId: input.organizationId,
      permissions: { file: ["create"] },
    });
    if (!success) throw forbidden({ entity: "File", action: "create" });
  } else {
    const { success } = await deps.userPermission.userHasPermission({
      permissions: { file: ["selfCreate"] },
    });
    if (!success) throw forbidden({ entity: "File", action: "create" });
  }

  const id = crypto.randomUUID();
  const s3Key = input.organizationId
    ? `org/${input.organizationId}/${id}/${input.filename}`
    : `personal/${input.userId}/${id}/${input.filename}`;

  await deps.fileRepo.insertPending(deps.db, {
    id,
    eventId: input.eventId ?? null,
    organizationId: input.organizationId ?? null,
    uploadedBy: input.userId,
    kind,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    originalFilename: input.filename,
    s3Key,
  });

  const { url } = await deps.s3Storage.createUploadUrl({
    key: s3Key,
    contentType: input.mimeType,
    contentLength: input.sizeBytes,
  });

  return { fileId: id, uploadUrl: url };
}
