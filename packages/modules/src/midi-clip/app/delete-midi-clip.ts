import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";

export async function deleteMidiClip(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort },
  input: { clipId: string },
) {
  return deps.midiClipRepo.delete(deps.db, { clipId: input.clipId });
}
