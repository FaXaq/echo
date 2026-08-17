import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FindFileByIdQueryPort } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export async function getFileDownloadUrl(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFileByIdQuery: FindFileByIdQueryPort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<{ downloadUrl: string }> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "download" });

  const file = await deps.findFileByIdQuery(deps.db, input.scope, { id: input.id });
  if (!file) throw notFound("File");

  const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
  return { downloadUrl: url };
}
