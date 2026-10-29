import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { isRawImage, previewKeyFor } from "../domain/index.js";

export async function createPreviewUrl(
  s3Storage: S3StoragePort,
  file: { s3Key: string; mimeType: string },
) {
  if (!isRawImage(file.mimeType)) return null;
  const { url } = await s3Storage.createDownloadUrl(previewKeyFor(file.s3Key));
  return url;
}
