import type { KyselyDB } from "@echo/db";
import { conflict, forbidden } from "@echo/errors";
import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import { isValidFileSize, kindForMimeType } from "../domain/index.js";
import { insertPendingFile } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export async function createUpload(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermission: CheckUserPermission;
    userHasPermissionInOrganization: CheckOrganizationPermission;
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
    const { success } = await deps.userHasPermissionInOrganization({
      organizationId: input.organizationId,
      permissions: { file: ["create"] },
    });
    if (!success) throw forbidden({ entity: "File", action: "create" });
  } else {
    const { success } = await deps.userHasPermission({
      permissions: { file: ["selfCreate"] },
    });
    if (!success) throw forbidden({ entity: "File", action: "create" });
  }

  const id = crypto.randomUUID();
  const s3Key = input.organizationId
    ? `org/${input.organizationId}/${id}/${input.filename}`
    : `personal/${input.userId}/${id}/${input.filename}`;

  await insertPendingFile(deps.db, {
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
