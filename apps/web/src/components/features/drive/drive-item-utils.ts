import dayjs from "dayjs";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/react";
import { FileText, Image as ImageIcon, Music, Video } from "lucide-react";
import type { Folder, OrganizationFile } from "@/services/resources/drive";

export const KIND_ICON = {
  audio: Music,
  video: Video,
  image: ImageIcon,
  document: FileText,
} as const;

export function formatDate(date: string | null) {
  return date ? dayjs(date).format("MMM D, YYYY") : "—";
}

export type DriveItemKind = "file" | "folder";
export type SelectionKey = `${DriveItemKind}:${string}`;

export function selectionKey(kind: DriveItemKind, id: string): SelectionKey {
  return `${kind}:${id}`;
}

function isDriveItemKind(value: string): value is DriveItemKind {
  return value === "file" || value === "folder";
}

export function parseSelectionKey(key: SelectionKey): { kind: DriveItemKind; id: string } {
  const [kind, id] = key.split(":");
  if (!isDriveItemKind(kind)) throw new Error(`Invalid selection key: ${key}`);
  return { kind, id };
}

export function isSelectionKey(value: string): value is SelectionKey {
  const [kind] = value.split(":");
  return isDriveItemKind(kind);
}

export type DriveRow = { kind: "folder"; data: Folder } | { kind: "file"; data: OrganizationFile };

export type DragData = { kind: "file"; id: string } | { kind: "folder"; id: string };

export type DragEndEventPayload = Parameters<DragEndEvent>[0];
export type DragStartEventPayload = Parameters<DragStartEvent>[0];

export function readDragData(data: Record<string, unknown> | undefined): DragData | null {
  if (!data) return null;
  const { kind, id } = data;
  if ((kind === "file" || kind === "folder") && typeof id === "string") return { kind, id };
  return null;
}

export function isFileDrag(event: React.DragEvent) {
  return event.dataTransfer.types.includes("Files");
}
