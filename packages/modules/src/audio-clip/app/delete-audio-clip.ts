import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";
import type { FileStoragePort } from "../../file/infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function deleteAudioClip(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort; fileStorage: FileStoragePort },
  input: { clipId: string },
) {
  const clip = await deps.audioClipRepo.findById(deps.db, { clipId: input.clipId });
  if (!clip) throw notFound("AudioClip");
  await deps.audioClipRepo.delete(deps.db, { clipId: input.clipId });
  await deps.fileStorage.deleteFile({ key: clip.file.storageKey });
}
