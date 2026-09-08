import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FindFilesByIdsQueryPort } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export async function getFilesDownloadUrls(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFilesByIdsQuery: FindFilesByIdsQueryPort;
  },
  input: { ids: string[]; scope: OrganizationScope },
): Promise<{ id: string; downloadUrl: string }[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "download" });

  const files = await deps.findFilesByIdsQuery(deps.db, input.scope, { ids: input.ids });

  return Promise.all(
    files.map(async (file) => {
      const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
      return { id: file.id, downloadUrl: url };
    }),
  );
}
