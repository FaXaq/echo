import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Place } from "../domain/index.js";
import type {
  DeleteOccurrencesCommandPort,
  DeleteOrphanedFilesCommandPort,
} from "../infrastructure/index.js";
import { purgeOrphanedFiles, type PurgeFailure } from "./purge-orphaned-files.js";

export async function removeOccurrences(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deleteOccurrencesCommand: DeleteOccurrencesCommandPort;
    deleteOrphanedFilesCommand: DeleteOrphanedFilesCommandPort;
  },
  input: { fileIds: string[]; place: Place; scope: OrganizationScope },
): Promise<{ removedFileIds: string[]; deletedFileIds: string[]; failures: PurgeFailure[] }> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "delete" });

  const removedFileIds = await deps.deleteOccurrencesCommand(deps.db, input.scope, {
    fileIds: input.fileIds,
    place: input.place,
  });
  if (removedFileIds.length === 0) throw notFound("Occurrence");

  const { deletedFileIds, failures } = await purgeOrphanedFiles(deps, {
    scope: input.scope,
    fileIds: removedFileIds,
  });
  return { removedFileIds, deletedFileIds, failures };
}
