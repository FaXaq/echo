export type FileKind = "audio" | "video" | "image";
export type FileStatus = "pending" | "uploaded";

export const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024;

export const MIME_TYPES_BY_KIND: Record<FileKind, readonly string[]> = {
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/flac", "audio/mp4"],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  image: ["image/png", "image/jpeg", "image/webp", "image/gif"],
};

export function kindForMimeType(mimeType: string): FileKind | null {
  const entry = (Object.entries(MIME_TYPES_BY_KIND) as [FileKind, readonly string[]][]).find(
    ([, mimeTypes]) => mimeTypes.includes(mimeType),
  );
  return entry ? entry[0] : null;
}

export function isValidFileSize(sizeBytes: number): boolean {
  return sizeBytes > 0 && sizeBytes <= MAX_FILE_SIZE_BYTES;
}

export type FileRecord = {
  id: string;
  eventId: string | null;
  organizationId: string | null;
  uploadedBy: string;
  uploadedByName: string;
  kind: FileKind;
  mimeType: string;
  sizeBytes: number;
  originalFilename: string;
  s3Key: string;
  status: FileStatus;
};
