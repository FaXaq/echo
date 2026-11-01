import { useSyncExternalStore } from "react";

// Keyed by the File itself: the same object sits in the upload mutation's variables.
const ratios = new WeakMap<File, number>();
const listeners = new Set<() => void>();
let version = 0;

export function setUploadProgress(file: File, ratio: number) {
  ratios.set(file, ratio);
  version++;
  listeners.forEach((listener) => listener());
}

export function getUploadProgress(file: File) {
  return ratios.get(file) ?? 0;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useUploadProgressVersion() {
  return useSyncExternalStore(subscribe, () => version);
}

export function totalUploadRatio(uploads: { sizeBytes: number; ratio: number }[]) {
  const totalBytes = uploads.reduce((sum, upload) => sum + upload.sizeBytes, 0);
  if (totalBytes === 0) return 0;
  return uploads.reduce((sum, upload) => sum + upload.sizeBytes * upload.ratio, 0) / totalBytes;
}
