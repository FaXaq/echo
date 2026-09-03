export type FileKind = "audio" | "video" | "image" | "document";
export type FileStatus = "pending" | "uploaded";

export const MIME_TYPES_BY_KIND: Record<FileKind, readonly string[]> = {
  audio: [
    "audio/mpeg",
    "audio/wav",
    "audio/ogg",
    "audio/flac",
    "audio/mp4",
    /* old itunes codec used by iphone voice-recorder */
    "audio/x-m4a",
  ],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  image: ["image/png", "image/jpeg", "image/webp", "image/gif"],
  document: [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

export function kindForMimeType(mimeType: string): FileKind | null {
  const entry = (Object.entries(MIME_TYPES_BY_KIND) as [FileKind, readonly string[]][]).find(
    ([, mimeTypes]) => mimeTypes.includes(mimeType),
  );
  return entry ? entry[0] : null;
}

export type FileRecord = {
  id: string;
  eventId: string | null;
  eventTitle: string | null;
  songId: string | null;
  folderId: string | null;
  organizationId: string;
  uploadedBy: string;
  uploadedByName: string;
  kind: FileKind;
  mimeType: string;
  sizeBytes: number;
  filename: string;
  originalFilename: string;
  s3Key: string;
  status: FileStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type FolderRecord = {
  id: string;
  organizationId: string;
  parentFolderId: string | null;
  name: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};
