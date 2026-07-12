import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort, AudioClip } from "../infrastructure/index.js";

export async function renameAudioClip(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort },
  input: { clipId: string; name: string },
): Promise<AudioClip> {
  return deps.audioClipRepo.rename(deps.db, input);
}
