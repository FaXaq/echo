import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound, quotaExceeded } from "@echo/errors";
import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import { exceedsLimit } from "@echo/modules/plan/domain";
import type { ResolveEntitlementsPort } from "@echo/modules/plan/app";
import type { GetOrganizationStorageUsageQueryPort } from "@echo/modules/plan/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { kindForMimeType } from "../domain/index.js";
import type {
  FindFolderByIdQueryPort,
  InsertPendingFileCommandPort,
  LinkFileToSongCommandPort,
  SongExistsInOrganizationQueryPort,
} from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export type GetPersonalOrganizationIdPort = (userId: string) => Promise<string | undefined>;

export async function createUpload(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermission: CheckUserPermission;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    insertPendingFileCommand: InsertPendingFileCommandPort;
    linkFileToSongCommand: LinkFileToSongCommandPort;
    songExistsInOrganizationQuery: SongExistsInOrganizationQueryPort;
    getPersonalOrganizationId: GetPersonalOrganizationIdPort;
    resolveOrganizationEntitlements: ResolveEntitlementsPort;
    getOrganizationStorageUsage: GetOrganizationStorageUsageQueryPort;
  },
  input: {
    userId: string;
    eventId?: string;
    songId?: string;
    folderId?: string | null;
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
    permissions: { drive: ["create"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "create" });

  if (input.folderId) {
    const folder = await deps.findFolderByIdQuery(deps.db, input.scope, { id: input.folderId });
    if (!folder) throw notFound("Folder");
  }

  if (input.songId) {
    const songExists = await deps.songExistsInOrganizationQuery(deps.db, input.scope, {
      songId: input.songId,
    });
    if (!songExists) throw notFound("Song");
  }

  const { limits } = await deps.resolveOrganizationEntitlements(deps.db, input.scope);

  if (input.sizeBytes > limits.maxFileSizeBytes) {
    throw quotaExceeded({
      limitName: "maxFileSizeBytes",
      limit: limits.maxFileSizeBytes,
      current: input.sizeBytes,
    });
  }

  const usedBytes = await deps.getOrganizationStorageUsage(deps.db, input.scope);
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
    folderId: input.folderId ?? null,
    uploadedBy: input.userId,
    kind,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    originalFilename: input.filename,
    s3Key,
  });

  if (input.songId) {
    await deps.linkFileToSongCommand(deps.db, input.scope, {
      songId: input.songId,
      fileId: id,
      linkedBy: input.userId,
    });
  }

  const { url } = await deps.s3Storage.createUploadUrl({
    key: s3Key,
    contentType: input.mimeType,
    contentLength: input.sizeBytes,
  });

  return { fileId: id, uploadUrl: url };
}
