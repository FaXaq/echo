import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";
import { conflict } from "@echo/errors";

export async function renameMidiClip(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort },
  input: { clipId: string; name: string },
) {
  if (!input.name.trim()) {
    throw conflict("Clip name cannot be empty");
  }
  return deps.midiClipRepo.rename(deps.db, {
    clipId: input.clipId,
    name: input.name.trim(),
  });
}
