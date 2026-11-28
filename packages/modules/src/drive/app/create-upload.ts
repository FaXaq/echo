import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, quotaExceeded } from "@echo/errors";
import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import { exceedsLimit } from "@echo/modules/plan/domain";
import type { ResolveEntitlementsPort } from "@echo/modules/plan/app";
import type { GetOrganizationStorageUsageQueryPort } from "@echo/modules/plan/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import {
  hasThumbnailKind,
  isRawImage,
  kindForMimeType,
  MAX_PREVIEW_BYTES,
  previewKeyFor,
  thumbnailKeyFor,
} from "../domain/index.js";
import type { MediaMetadata, Place } from "../domain/index.js";
import { assertPlaceExists } from "./assert-place-exists.js";
import type {
  EventExistsInOrganizationQueryPort,
  FindFolderByIdQueryPort,
  InsertPendingFileCommandPort,
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
    eventExistsInOrganizationQuery: EventExistsInOrganizationQueryPort;
    songExistsInOrganizationQuery: SongExistsInOrganizationQueryPort;
    getPersonalOrganizationId: GetPersonalOrganizationIdPort;
    resolveOrganizationEntitlements: ResolveEntitlementsPort;
    getOrganizationStorageUsage: GetOrganizationStorageUsageQueryPort;
  },
  input: Partial<MediaMetadata> & {
    userId: string;
    place: Place;
    scope: OrganizationScope;
    mimeType: string;
    sizeBytes: number;
    filename: string;
    previewSizeBytes?: number;
    thumbnailSizeBytes?: number;
  },
): Promise<{
  fileId: string;
  uploadUrl: string;
  previewUploadUrl: string | null;
  thumbnailUploadUrl: string | null;
}> {
  const kind = kindForMimeType(input.mimeType);
  if (!kind) throw conflict("Unsupported file type");

  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["create"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "create" });

  await assertPlaceExists(deps, input.scope, input.place);

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
    place: input.place,
    uploadedBy: input.userId,
    kind,
    mimeType: input.mimeType,
    sizeBytes: input.sizeBytes,
    durationSeconds: input.durationSeconds ?? null,
    width: input.width ?? null,
    height: input.height ?? null,
    originalFilename: input.filename,
    s3Key,
  });

  const { url } = await deps.s3Storage.createUploadUrl({
    key: s3Key,
    contentType: input.mimeType,
    contentLength: input.sizeBytes,
  });

  const signJpegUpload = async (key: string, contentLength: number | undefined) =>
    contentLength
      ? (await deps.s3Storage.createUploadUrl({ key, contentType: "image/jpeg", contentLength }))
          .url
      : null;

  const previewUploadUrl = await signJpegUpload(
    previewKeyFor(s3Key),
    isRawImage(input.mimeType) && (input.previewSizeBytes ?? 0) <= MAX_PREVIEW_BYTES
      ? input.previewSizeBytes
      : undefined,
  );
  const thumbnailUploadUrl = await signJpegUpload(
    thumbnailKeyFor(s3Key),
    hasThumbnailKind(input.mimeType) ? input.thumbnailSizeBytes : undefined,
  );

  return { fileId: id, uploadUrl: url, previewUploadUrl, thumbnailUploadUrl };
}
