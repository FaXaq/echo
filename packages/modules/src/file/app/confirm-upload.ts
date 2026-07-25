import type { KyselyDB } from "@echo/db";
import { conflict, notFound } from "@echo/errors";
import type { FileRecord } from "../domain/index.js";
import type { FileRepoPort } from "../infrastructure/file-repository.port.js";
import type { S3StoragePort } from "../infrastructure/s3-storage.port.js";

export async function confirmUpload(
  deps: { db: KyselyDB; fileRepo: FileRepoPort; s3Storage: S3StoragePort },
  input: { id: string },
): Promise<FileRecord> {
  const file = await deps.fileRepo.findById(deps.db, input.id);
  if (!file) throw notFound("File");

  const { exists } = await deps.s3Storage.headObject(file.s3Key);
  if (!exists) throw conflict("Upload was not completed");

  const updated = await deps.fileRepo.markUploaded(deps.db, input.id);
  if (!updated) throw notFound("File");
  return updated;
}
