import { useSyncExternalStore } from "react";

const empty: string[] = [];
const clipboards = new Map<string, string[]>();
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function copyFiles(organizationId: string, fileIds: string[]) {
  clipboards.set(organizationId, fileIds);
  emit();
}

export function useDriveClipboard(organizationId: string) {
  const fileIds = useSyncExternalStore(subscribe, () => clipboards.get(organizationId) ?? empty);
  const clear = () => {
    clipboards.delete(organizationId);
    emit();
  };
  return { fileIds, clear };
}
