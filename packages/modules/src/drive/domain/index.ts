export type FileKind = "audio" | "video" | "image" | "document";
export type FileStatus = "pending" | "uploaded";

/* browsers often report an empty or vendor-specific type for camera raw files */
export const RAW_IMAGE_MIME_TYPES_BY_EXTENSION: Record<string, string> = {
  dng: "image/x-adobe-dng",
  cr2: "image/x-canon-cr2",
  cr3: "image/x-canon-cr3",
  nef: "image/x-nikon-nef",
  arw: "image/x-sony-arw",
  raf: "image/x-fuji-raf",
  orf: "image/x-olympus-orf",
  rw2: "image/x-panasonic-rw2",
};

export const RAW_IMAGE_MIME_TYPES = Object.values(RAW_IMAGE_MIME_TYPES_BY_EXTENSION);

export const MIME_TYPES_BY_KIND: Record<FileKind, readonly string[]> = {
  audio: [
    "audio/mpeg",
    "audio/wav",
    /* alternate mime types some browsers/OSes report for .wav files */
    "audio/x-wav",
    "audio/wave",
    "audio/ogg",
    "audio/flac",
    "audio/mp4",
    /* old itunes codec used by iphone voice-recorder */
    "audio/x-m4a",
  ],
  video: ["video/mp4", "video/webm", "video/quicktime"],
  image: [
    "image/png",
    "image/jpeg",
    "image/webp",
    "image/gif",
    "image/heic",
    "image/heif",
    "image/avif",
    "image/bmp",
    "image/svg+xml",
    /* previewed through the embedded jpeg stored at previewKeyFor(s3Key) */
    ...RAW_IMAGE_MIME_TYPES,
  ],
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

export function isRawImage(mimeType: string) {
  return RAW_IMAGE_MIME_TYPES.includes(mimeType);
}

export function isHeicImage(mimeType: string) {
  return mimeType === "image/heic" || mimeType === "image/heif";
}

export function previewKeyFor(s3Key: string) {
  return `${s3Key}.preview.jpg`;
}

export const MAX_PREVIEW_BYTES = 3_145_728;

export const MAX_THUMBNAIL_BYTES = 1_048_576;

export function thumbnailKeyFor(s3Key: string) {
  return `${s3Key}.thumbnail.jpg`;
}

export function hasThumbnailKind(mimeType: string) {
  const kind = kindForMimeType(mimeType);
  return kind === "image" || kind === "video";
}

export function fileObjectKeys(file: { s3Key: string; mimeType: string }) {
  return [
    file.s3Key,
    ...(isRawImage(file.mimeType) ? [previewKeyFor(file.s3Key)] : []),
    ...(hasThumbnailKind(file.mimeType) ? [thumbnailKeyFor(file.s3Key)] : []),
  ];
}

export function mimeTypeForFile(file: { name: string; type: string }) {
  if (kindForMimeType(file.type)) return file.type;
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  return RAW_IMAGE_MIME_TYPES_BY_EXTENSION[extension] ?? file.type;
}

export type MediaMetadata = {
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
};

export type FileRecord = {
  id: string;
  eventId: string | null;
  eventTitle: string | null;
  folderId: string | null;
  organizationId: string;
  uploadedBy: string;
  uploadedByName: string;
  kind: FileKind;
  mimeType: string;
  sizeBytes: number;
  durationSeconds: number | null;
  width: number | null;
  height: number | null;
  filename: string;
  originalFilename: string;
  s3Key: string;
  hasThumbnail: boolean;
  status: FileStatus;
  createdAt: Date | null;
  updatedAt: Date | null;
};

export type Role = "demo" | "final";

export type SongFileRecord = FileRecord & {
  role: Role | null;
  version: number | null;
  linkedAt: Date;
  linkedBy: string;
};

export type FolderRecord = {
  id: string;
  organizationId: string;
  parentFolderId: string | null;
  name: string;
  createdAt: Date | null;
  updatedAt: Date | null;
};
