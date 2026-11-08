import type { KyselyDB } from "@echo/db";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type {
  FindFilesMissingThumbnailQueryPort,
  MarkFileHasThumbnailCommandPort,
} from "../infrastructure/index.js";
import { isRawImage, previewKeyFor, thumbnailKeyFor } from "../domain/index.js";
import type { FileRecord } from "../domain/index.js";
import type { FetchBytesPort } from "./backfill-file-durations.js";

export type ResizeImagePort = (bytes: Uint8Array) => Promise<Uint8Array>;
export type CaptureVideoFramePort = (url: string) => Promise<Uint8Array>;
export type PutBytesPort = (url: string, bytes: Uint8Array, contentType: string) => Promise<void>;

type BackfillThumbnailsDeps = {
  db: KyselyDB;
  findFilesMissingThumbnailQuery: FindFilesMissingThumbnailQueryPort;
  markFileHasThumbnailCommand: MarkFileHasThumbnailCommandPort;
  s3Storage: S3StoragePort;
  fetchBytes: FetchBytesPort;
  resizeImage: ResizeImagePort;
  captureVideoFrame: CaptureVideoFramePort;
  putBytes: PutBytesPort;
  onSkip?: (file: FileRecord, error: unknown) => void;
};

async function generateThumbnail(deps: BackfillThumbnailsDeps, file: FileRecord) {
  if (file.kind === "video") {
    const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
    return deps.captureVideoFrame(url);
  }
  const sourceKey = isRawImage(file.mimeType) ? previewKeyFor(file.s3Key) : file.s3Key;
  const { url } = await deps.s3Storage.createDownloadUrl(sourceKey);
  return deps.resizeImage(await deps.fetchBytes(url));
}

export async function backfillFileThumbnails(deps: BackfillThumbnailsDeps) {
  const files = await deps.findFilesMissingThumbnailQuery(deps.db);

  let updated = 0;
  let skipped = 0;

  for (const file of files) {
    try {
      const thumbnail = await generateThumbnail(deps, file);
      const { url } = await deps.s3Storage.createUploadUrl({
        key: thumbnailKeyFor(file.s3Key),
        contentType: "image/jpeg",
        contentLength: thumbnail.byteLength,
      });
      await deps.putBytes(url, thumbnail, "image/jpeg");
      await deps.markFileHasThumbnailCommand(deps.db, { id: file.id });
      updated++;
    } catch (error) {
      skipped++;
      deps.onSkip?.(file, error);
    }
  }

  return { processed: files.length, updated, skipped };
}
