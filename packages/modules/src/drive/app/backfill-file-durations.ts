import type { KyselyDB } from "@echo/db";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type {
  FindFilesMissingDurationQueryPort,
  UpdateFileDurationByIdCommandPort,
} from "../infrastructure/index.js";
import type { FileRecord } from "../domain/index.js";

export type FetchBytesPort = (url: string) => Promise<Uint8Array>;
export type ParseDurationPort = (bytes: Uint8Array, mimeType: string) => Promise<number | null>;

export async function backfillFileDurations(deps: {
  db: KyselyDB;
  findFilesMissingDurationQuery: FindFilesMissingDurationQueryPort;
  updateFileDurationByIdCommand: UpdateFileDurationByIdCommandPort;
  s3Storage: S3StoragePort;
  fetchBytes: FetchBytesPort;
  parseDuration: ParseDurationPort;
  onSkip?: (file: FileRecord, error: unknown) => void;
}): Promise<{ processed: number; updated: number; skipped: number }> {
  const files = await deps.findFilesMissingDurationQuery(deps.db);

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
      const bytes = await deps.fetchBytes(url);
      const durationSeconds = await deps.parseDuration(bytes, file.mimeType);

      if (durationSeconds === null) {
        throw new Error("Duration could not be determined");
      }

      await deps.updateFileDurationByIdCommand(deps.db, { id: file.id, durationSeconds });
      updated++;
    } catch (error) {
      skipped++;
      deps.onSkip?.(file, error);
    }
  }

  return { processed: files.length, updated, skipped };
}
