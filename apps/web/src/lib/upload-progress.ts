import { useSyncExternalStore } from "react";

const ratios = new WeakMap<File, number>();
const durations = new WeakMap<File, number | null>();
const listeners = new Set<() => void>();
let version = 0;

function notify() {
  version++;
  listeners.forEach((listener) => listener());
}

export function setUploadProgress(file: File, ratio: number) {
  ratios.set(file, ratio);
  notify();
}

export function resetUploadProgress(file: File) {
  ratios.delete(file);
  notify();
}

export function setUploadDuration(file: File, durationSeconds: number | null) {
  durations.set(file, durationSeconds);
  notify();
}

export function getUploadDuration(file: File) {
  return durations.get(file) ?? null;
}

export function getUploadProgress(file: File) {
  return ratios.get(file);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useRerenderOnUploadProgress() {
  useSyncExternalStore(subscribe, () => version);
}

export function totalUploadRatio(uploads: { sizeBytes: number; ratio: number }[]) {
  const totalBytes = uploads.reduce((sum, upload) => sum + upload.sizeBytes, 0);
  if (totalBytes === 0) return 0;
  return uploads.reduce((sum, upload) => sum + upload.sizeBytes * upload.ratio, 0) / totalBytes;
}
