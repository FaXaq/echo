/**
 * Pure file utility functions.
 * No React, no tRPC — importable in any context including unit tests.
 */

/**
 * Detect file type from a DataTransferItemList (during dragover — filename not yet available).
 */
export function detectFileTypeFromItems(
  items: DataTransferItemList,
): "audio" | "midi" | null {
  if (!items.length) return null;
  const item = items[0];
  if (item.kind !== "file") return null;
  const mime = item.type.toLowerCase();
  const entry = item.webkitGetAsEntry?.();
  const name = (entry?.name ?? "").toLowerCase();
  if (
    mime === "audio/midi" ||
    mime === "audio/x-midi" ||
    name.endsWith(".mid") ||
    name.endsWith(".midi")
  )
    return "midi";
  if (mime.startsWith("audio/") || /\.(wav|mp3|ogg|flac|aac|m4a)$/.test(name))
    return "audio";
  return null;
}

/**
 * Detect file type from a File object (during ondrop — full filename available).
 */
export function detectFileTypeFromFile(file: File): "audio" | "midi" | null {
  const mime = file.type.toLowerCase();
  const name = file.name.toLowerCase();
  if (
    mime === "audio/midi" ||
    mime === "audio/x-midi" ||
    name.endsWith(".mid") ||
    name.endsWith(".midi")
  )
    return "midi";
  if (mime.startsWith("audio/") || /\.(wav|mp3|ogg|flac|aac|m4a)$/.test(name))
    return "audio";
  return null;
}

/**
 * Read the duration of an audio File in milliseconds.
 * Resolves to undefined if the duration cannot be determined.
 */
export function getAudioDurationMs(file: File): Promise<number | undefined> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const audio = new Audio();
    audio.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(
        Number.isFinite(audio.duration)
          ? Math.round(audio.duration * 1000)
          : undefined,
      );
    };
    audio.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    };
    audio.src = url;
  });
}
