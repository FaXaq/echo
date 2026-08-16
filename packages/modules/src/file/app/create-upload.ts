import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, quotaExceeded } from "@echo/errors";
import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import { exceedsLimit } from "@echo/modules/plan/domain";
import type {
  GetOrganizationStorageUsagePort,
  ResolveEntitlementsPort,
} from "@echo/modules/plan/app";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { kindForMimeType } from "../domain/index.js";
import type { InsertPendingFileCommandPort } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export type GetPersonalOrganizationIdPort = (userId: string) => Promise<string | undefined>;

export async function createUpload(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermission: CheckUserPermission;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    insertPendingFileCommand: InsertPendingFileCommandPort;
    getPersonalOrganizationId: GetPersonalOrganizationIdPort;
    resolveOrganizationEntitlements: ResolveEntitlementsPort;
    getOrganizationStorageUsage: GetOrganizationStorageUsagePort;
  },
  input: {
    userId: string;
    eventId?: string;
    scope: OrganizationScope;
    mimeType: string;
    sizeBytes: number;
    filename: string;
  },
): Promise<{ fileId: string; uploadUrl: string }> {
  const kind = kindForMimeType(input.mimeType);
  if (!kind) throw conflict("Unsupported file type");

  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["create"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "create" });

  const { limits } = await deps.resolveOrganizationEntitlements(input.scope);

  if (input.sizeBytes > limits.maxFileSizeBytes) {
    throw quotaExceeded({
      limitName: "maxFileSizeBytes",
      limit: limits.maxFileSizeBytes,
      current: input.sizeBytes,
    });
  }

  const usedBytes = await deps.getOrganizationStorageUsage(input.scope);
  if (exceedsLimit({ current: usedBytes, delta: input.sizeBytes, limit: limits.storageBytes })) {
    throw quotaExceeded({
      limitName: "storageBytes",
      limit: limits.storageBytes,
      current: usedBytes,
    });
  }

  const id = crypto.randomUUID();
  const s3Key = `org/${input.scope.organizationId}/${id}/${input.filename}`;

  await deps.insertPendingFileCommand(deps.db, input.scope, {
    id,
    eventId: input.eventId ?? null,
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
