import type { KyselyDB } from "@echo/db";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { SongFileRecord } from "../domain/index.js";
import type { ListFilesBySongQueryPort } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { createPreviewUrl, createThumbnailUrl } from "./create-preview-url.js";
import { forbidden } from "@echo/errors";

type ReadableSongFile = SongFileRecord & {
  downloadUrl: string;
  previewUrl: string | null;
  thumbnailUrl: string | null;
};

export async function listSongFiles(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    s3Storage: S3StoragePort;
    listFilesBySongQuery: ListFilesBySongQueryPort;
  },
  input: { songId: string; scope: OrganizationScope },
): Promise<ReadableSongFile[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "list song files" });

  const files = await deps.listFilesBySongQuery(deps.db, input.scope, { songId: input.songId });

  const readable: ReadableSongFile[] = [];
  for (const file of files) {
    const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
    readable.push({
      ...file,
      downloadUrl: url,
      previewUrl: await createPreviewUrl(deps.s3Storage, file),
      thumbnailUrl: await createThumbnailUrl(deps.s3Storage, file),
    });
  }
  return readable;
}
