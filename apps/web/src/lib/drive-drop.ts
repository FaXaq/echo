export interface OsDropEntry {
  isFile: boolean;
  isDirectory: boolean;
}

export type OsDropEvaluation =
  | { accepted: true }
  | { accepted: false; reason: "no-files" | "contains-directory" };

export function evaluateOsFileDrop(entries: OsDropEntry[]): OsDropEvaluation {
  if (entries.length === 0) return { accepted: false, reason: "no-files" };
  if (entries.some((entry) => entry.isDirectory)) {
    return { accepted: false, reason: "contains-directory" };
  }
  return { accepted: true };
}

export function resolveDropTargetFolderId({
  hoveredFolderId,
  currentFolderId,
}: {
  hoveredFolderId: string | null;
  currentFolderId: string | null;
}) {
  return hoveredFolderId ?? currentFolderId;
}
