import type { KyselyDB } from "@echo/db";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type {
  FindFilesMissingDimensionsQueryPort,
  UpdateFileDimensionsByIdCommandPort,
} from "../infrastructure/index.js";
import { thumbnailKeyFor } from "../domain/index.js";
import type { FileRecord } from "../domain/index.js";
import type { FetchBytesPort } from "./backfill-file-durations.js";

export type ReadImageSizePort = (bytes: Uint8Array) => Promise<{ width: number; height: number }>;

export async function backfillFileDimensions(deps: {
  db: KyselyDB;
  findFilesMissingDimensionsQuery: FindFilesMissingDimensionsQueryPort;
  updateFileDimensionsByIdCommand: UpdateFileDimensionsByIdCommandPort;
  s3Storage: S3StoragePort;
  fetchBytes: FetchBytesPort;
  readImageSize: ReadImageSizePort;
  onSkip?: (file: FileRecord, error: unknown) => void;
}) {
  const files = await deps.findFilesMissingDimensionsQuery(deps.db);

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const { url } = await deps.s3Storage.createDownloadUrl(thumbnailKeyFor(file.s3Key));
      const size = await deps.readImageSize(await deps.fetchBytes(url));
      await deps.updateFileDimensionsByIdCommand(deps.db, { id: file.id, ...size });
      updated++;
    } catch (error) {
      skipped++;
      deps.onSkip?.(file, error);
    }
  }

  return { processed: files.length, updated, skipped };
}
