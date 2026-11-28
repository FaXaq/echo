import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { DeleteFileByIdCommandPort, FindFileByIdQueryPort } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { fileObjectKeys } from "../domain/index.js";

export async function cancelUpload(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    findFileByIdQuery: FindFileByIdQueryPort;
    deleteFileByIdCommand: DeleteFileByIdCommandPort;
  },
  input: { id: string; userId: string; uploadId?: string; scope: OrganizationScope },
): Promise<void> {
  const file = await deps.findFileByIdQuery(deps.db, input.scope, { id: input.id });
  if (!file) return;
  if (file.uploadedBy !== input.userId) throw forbidden({ entity: "File", action: "delete" });

  if (input.uploadId) {
    // Already completed or aborted: nothing left to free.
    await deps.s3Storage
      .abortMultipartUpload({ key: file.s3Key, uploadId: input.uploadId })
      .catch(() => undefined);
  }
  await Promise.all(fileObjectKeys(file).map((key) => deps.s3Storage.deleteObject(key)));
  await deps.deleteFileByIdCommand(deps.db, input.scope, { id: input.id });
}
