import type { KyselyDB } from "@echo/db";
import type { MidiClipRepoPort } from "../infrastructure/index.js";

export async function listMidiClipsBySong(
  deps: { db: KyselyDB; midiClipRepo: MidiClipRepoPort },
  input: { songId: string },
) {
  return deps.midiClipRepo.listBySong(deps.db, { songId: input.songId });
}
