import { kindForMimeType, type MediaMetadata } from "@echo/modules/drive/domain";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";

dayjs.extend(duration);

export function downloadBlob(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoking immediately can race the browser's download start (esp.
  // Firefox), which then falls back to the blob URL's uuid as the
  // filename. A short delay lets the download begin before we free it.
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

// The URL must be signed with an attachment Content-Disposition so the browser
// streams it to disk natively instead of buffering it or navigating to it.
export function downloadFile(url: string) {
  const link = document.createElement("a");
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

const NON_PREVIEWABLE_MIME_TYPES = new Set([
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
]);

export function canPreviewInline(mimeType: string): boolean {
  return !NON_PREVIEWABLE_MIME_TYPES.has(mimeType);
}

// Camera raw files embed the camera's own JPEG render, so we upload that as the preview.
export async function extractRawPreview(file: Blob) {
  const preview = pickRawPreview(findEmbeddedJpegs(new Uint8Array(await file.arrayBuffer())));
  return preview ? new Blob([preview], { type: "image/jpeg" }) : null;
}

export function findEmbeddedJpegs(bytes: Uint8Array<ArrayBuffer>) {
  const jpegs: Uint8Array<ArrayBuffer>[] = [];
  for (let start = 0; start + 3 < bytes.length; start++) {
    if (bytes[start] !== 0xff || bytes[start + 1] !== 0xd8 || bytes[start + 2] !== 0xff) continue;
    const end = findJpegEnd(bytes, start);
    if (end === null) continue;
    jpegs.push(bytes.subarray(start, end));
    start = end - 1;
  }
  return jpegs;
}

// Walks the header segments by length (skipping EXIF thumbnails) up to the scan,
// then finds EOI: scan data byte-stuffs 0xff, so 0xffd9 only appears at the end.
function findJpegEnd(bytes: Uint8Array, start: number) {
  let offset = start + 2;
  while (true) {
    if (offset + 4 > bytes.length || bytes[offset] !== 0xff) return null;
    const marker = bytes[offset + 1];
    offset += 2 + ((bytes[offset + 2]! << 8) | bytes[offset + 3]!);
    if (marker === 0xda) break;
  }
  for (; offset + 1 < bytes.length; offset++) {
    if (bytes[offset] === 0xff && bytes[offset + 1] === 0xd9) return offset + 2;
  }
  return null;
}

const MAX_PREVIEW_BYTES = 3 * 1024 * 1024;

// Largest preview that stays light enough for a gallery grid, else the smallest oversized one.
function pickRawPreview(jpegs: Uint8Array<ArrayBuffer>[]) {
  const bySize = [...jpegs].sort((a, b) => a.length - b.length);
  const light = bySize.filter((jpeg) => jpeg.length <= MAX_PREVIEW_BYTES);
  return light.at(-1) ?? bySize[0] ?? null;
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function fileTypeLabel(filename: string) {
  const dot = filename.lastIndexOf(".");
  const extension = dot > 0 ? filename.slice(dot + 1, dot + 5) : "";
  return extension.toUpperCase() || "FILE";
}

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const d = dayjs.duration(seconds * 1000);
  return d.hours() > 0 ? d.format("H:mm:ss") : d.format("m:ss");
}

const emptyMediaMetadata: MediaMetadata = { durationSeconds: null, width: null, height: null };

export async function getMediaMetadata(file: File): Promise<MediaMetadata> {
  const kind = kindForMimeType(file.type);
  if (kind !== "audio" && kind !== "video") return emptyMediaMetadata;

  const url = URL.createObjectURL(file);
  try {
    return await readMediaMetadata(url, kind);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const MEDIA_METADATA_TIMEOUT_MS = 15_000;

// Sets src directly (no <source type>) so the browser sniffs the bytes: a declared type it
// doesn't claim to support (e.g. video/quicktime in Chrome) would otherwise skip the file silently.
export function readMediaMetadata(url: string, kind: "audio" | "video"): Promise<MediaMetadata> {
  const mediaElement = document.createElement(kind);
  mediaElement.preload = "metadata";

  return new Promise<MediaMetadata>((resolve) => {
    const timeout = setTimeout(() => resolve(emptyMediaMetadata), MEDIA_METADATA_TIMEOUT_MS);
    mediaElement.addEventListener("loadedmetadata", () => {
      clearTimeout(timeout);
      resolve({
        durationSeconds: Number.isFinite(mediaElement.duration)
          ? Math.round(mediaElement.duration)
          : null,
        width: mediaElement instanceof HTMLVideoElement ? mediaElement.videoWidth || null : null,
        height: mediaElement instanceof HTMLVideoElement ? mediaElement.videoHeight || null : null,
      });
    });
    mediaElement.addEventListener("error", () => {
      clearTimeout(timeout);
      resolve(emptyMediaMetadata);
    });
    mediaElement.src = url;
  }).finally(() => mediaElement.removeAttribute("src"));
}

export function putWithProgress(
  url: string,
  body: Blob,
  contentType: string,
  onProgress: (ratio: number) => void,
) {
  return new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("Content-Type", contentType);
    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable) onProgress(event.loaded / event.total);
    });
    xhr.addEventListener("load", () =>
      xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Upload failed")),
    );
    xhr.addEventListener("error", () => reject(new Error("Upload failed")));
    xhr.send(body);
  });
}
