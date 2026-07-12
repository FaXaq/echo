import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";

export async function deleteManyMidiClips(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort },
  input: { clipIds: string[] },
) {
  if (input.clipIds.length === 0) return;
  await deps.midiClipRepo.deleteMany(deps.db, { clipIds: input.clipIds });
}
