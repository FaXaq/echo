import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { DeleteOrphanedFilesCommandPort } from "../infrastructure/index.js";
import { fileObjectKeys } from "../domain/index.js";

export type PurgeFailure = { fileId: string; error: unknown };

export async function purgeOrphanedFiles(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    deleteOrphanedFilesCommand: DeleteOrphanedFilesCommandPort;
  },
  input: { scope: OrganizationScope; fileIds: string[] },
): Promise<{ deletedFileIds: string[]; failures: PurgeFailure[] }> {
  const deleted = await deps.deleteOrphanedFilesCommand(deps.db, input.scope, {
    fileIds: input.fileIds,
  });

  const settled = await Promise.allSettled(
    deleted.map((file) =>
      Promise.all(fileObjectKeys(file).map((key) => deps.s3Storage.deleteObject(key))),
    ),
  );

  return {
    deletedFileIds: deleted.map((file) => file.id),
    failures: settled.flatMap((outcome, index) =>
      outcome.status === "rejected" ? [{ fileId: deleted[index]!.id, error: outcome.reason }] : [],
    ),
  };
}
