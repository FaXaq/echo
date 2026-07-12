import type { SongChord } from "./index.js";

export function parseChords(raw: unknown): SongChord[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (Array.isArray(raw)) return raw as SongChord[];
  return [];
}
