import { kindForMimeType } from "@echo/modules/drive/domain";
import { match } from "ts-pattern";
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

export async function downloadFile(url: string, filename: string) {
  const response = await fetch(url);
  const blob = await response.blob();
  downloadBlob(blob, filename);
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

export function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const d = dayjs.duration(seconds * 1000);
  return d.hours() > 0 ? d.format("H:mm:ss") : d.format("m:ss");
}

export function getMediaDuration(file: File): Promise<number | null> {
  const kind = kindForMimeType(file.type);
  if (kind !== "audio" && kind !== "video") return Promise.resolve(null);

  const url = URL.createObjectURL(file);

  const mediaElement = match(kind)
    .with("audio", () => {
      const audio = document.createElement("audio");
      audio.setAttribute("src", url);
      return audio;
    })
    .with("video", () => {
      const video = document.createElement("video");
      const source = document.createElement("source");
      source.setAttribute("src", url);
      source.setAttribute("type", file.type);

      video.appendChild(source);
      return video;
    })
    .exhaustive();

  return new Promise((resolve) => {
    mediaElement.addEventListener("loadedmetadata", () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(mediaElement.duration) ? Math.round(mediaElement.duration) : null);
    });

    mediaElement.addEventListener("error", () => {
      URL.revokeObjectURL(url);
      resolve(null);
    });
  });
}
