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
