import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Place } from "../domain/index.js";
import type {
  DeleteOccurrenceCommandPort,
  DeleteOrphanedFilesCommandPort,
} from "../infrastructure/index.js";
import { purgeOrphanedFiles, type PurgeFailure } from "./purge-orphaned-files.js";

export async function removeOccurrence(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteOccurrenceCommand: DeleteOccurrenceCommandPort;
    deleteOrphanedFilesCommand: DeleteOrphanedFilesCommandPort;
  },
  input: { fileId: string; place: Place; scope: OrganizationScope },
): Promise<{ deleted: boolean; failures: PurgeFailure[] }> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "delete" });

  const removed = await deps.deleteOccurrenceCommand(deps.db, input.scope, {
    fileId: input.fileId,
    place: input.place,
  });
  if (!removed) throw notFound("Occurrence");

  const { deletedFileIds, failures } = await purgeOrphanedFiles(deps, {
    scope: input.scope,
    fileIds: [input.fileId],
  });
  return { deleted: deletedFileIds.includes(input.fileId), failures };
}
