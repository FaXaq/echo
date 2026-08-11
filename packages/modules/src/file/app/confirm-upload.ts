import { conflict, notFound } from "@echo/errors";
import type { FileRecord } from "../domain/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export type FindFileByIdPort = (id: string) => Promise<FileRecord | null>;
export type MarkFileUploadedPort = (
  id: string,
  sizeBytes: number | null,
) => Promise<FileRecord | null>;

export async function confirmUpload(
  deps: {
    s3Storage: S3StoragePort;
    findFileById: FindFileByIdPort;
    markFileUploaded: MarkFileUploadedPort;
  },
  input: { id: string },
): Promise<FileRecord> {
  const file = await deps.findFileById(input.id);
  if (!file) throw notFound("File");

  const { exists, sizeBytes } = await deps.s3Storage.headObject(file.s3Key);
  if (!exists) throw conflict("Upload was not completed");

  const updated = await deps.markFileUploaded(input.id, sizeBytes);
  if (!updated) throw notFound("File");
  return updated;
}
