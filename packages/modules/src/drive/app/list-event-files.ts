import type { KyselyDB } from "@echo/db";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import type { ListFilesByEventQueryPort } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { forbidden } from "@echo/errors";

export async function listEventFiles(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    s3Storage: S3StoragePort;
    listFilesByEventQuery: ListFilesByEventQueryPort;
  },
  input: { eventId: string; scope: OrganizationScope },
): Promise<(FileRecord & { downloadUrl: string })[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "list event files" });

  const files = await deps.listFilesByEventQuery(deps.db, input.scope, { eventId: input.eventId });

  const readable: (FileRecord & { downloadUrl: string })[] = [];
  for (const file of files) {
    const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
    readable.push({ ...file, downloadUrl: url });
  }
  return readable;
}
