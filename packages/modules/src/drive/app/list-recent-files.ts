import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import type { ListRecentFilesQueryPort } from "../infrastructure/index.js";
import { createPreviewUrl, createThumbnailUrl } from "./create-preview-url.js";

type Deps = {
  db: KyselyDB;
  userHasPermissionInOrganization: CheckOrganizationPermission;
  listRecentFilesQuery: ListRecentFilesQueryPort;
};

async function withUrls(s3Storage: S3StoragePort, file: FileRecord) {
  return {
    ...file,
    downloadUrl: (await s3Storage.createDownloadUrl(file.s3Key)).url,
    previewUrl: await createPreviewUrl(s3Storage, file),
    thumbnailUrl: await createThumbnailUrl(s3Storage, file),
  };
}

async function assertCanRead(deps: Deps, scope: OrganizationScope) {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "read" });
}

export async function listRecentFiles(
  deps: Deps & { s3Storage: S3StoragePort },
  input: { scope: OrganizationScope; limit: number },
) {
  await assertCanRead(deps, input.scope);
  const files = await deps.listRecentFilesQuery(deps.db, input.scope, {
    kinds: ["audio", "document"],
    limit: input.limit,
  });
  return Promise.all(files.map((file) => withUrls(deps.s3Storage, file)));
}

export async function listRecentMedia(
  deps: Deps & { s3Storage: S3StoragePort },
  input: { scope: OrganizationScope; limit: number },
) {
  await assertCanRead(deps, input.scope);
  const files = await deps.listRecentFilesQuery(deps.db, input.scope, {
    kinds: ["image", "video"],
    limit: input.limit,
  });

  return Promise.all(files.map((file) => withUrls(deps.s3Storage, file)));
}
