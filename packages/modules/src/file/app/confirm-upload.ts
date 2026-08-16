import type { KyselyDB } from "@echo/db";
import { conflict, notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import type {
  FindFileByIdQueryPort,
  MarkFileUploadedCommandPort,
} from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export async function confirmUpload(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    findFileByIdQuery: FindFileByIdQueryPort;
    markFileUploadedCommand: MarkFileUploadedCommandPort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<FileRecord> {
  const file = await deps.findFileByIdQuery(deps.db, input.scope, { id: input.id });
  if (!file) throw notFound("File");

  const { exists, sizeBytes } = await deps.s3Storage.headObject(file.s3Key);
  if (!exists) throw conflict("Upload was not completed");

  const updated = await deps.markFileUploadedCommand(deps.db, input.scope, {
    id: input.id,
    sizeBytes,
  });
  if (!updated) throw notFound("File");
  return updated;
}
