import type { DB, KyselyDB } from "@echo/db";
import { conflict, notFound } from "@echo/errors";
import type { FileRecord } from "../domain/index.js";
import { findFileById, markFileUploaded } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { inject } from "../../utils/inject.js";
import type { Kysely } from "kysely";

export async function confirmUpload(
  deps: { db: Kysely<DB>, s3Storage: S3StoragePort },
  input: { id: string },
): Promise<FileRecord> {
  const file = await findFileById(deps.db, input.id);
  if (!file) throw notFound("File");

  const { exists } = await deps.s3Storage.headObject(file.s3Key);
  if (!exists) throw conflict("Upload was not completed");

  const updated = await markFileUploaded(deps.db, input.id);
  if (!updated) throw notFound("File");
  return updated;
};
