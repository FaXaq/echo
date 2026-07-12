import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";

export async function listAudioClips(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort },
  input: { songId: string },
) {
  return deps.audioClipRepo.listBySong(deps.db, { songId: input.songId });
}
