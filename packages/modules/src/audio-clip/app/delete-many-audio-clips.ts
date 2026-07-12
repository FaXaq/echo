import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort } from "../infrastructure/index.js";
import type { FileStoragePort } from "../../file/infrastructure/index.js";

export async function deleteManyAudioClips(
  deps: { db: KyselyDB; audioClipRepo: AudioClipRepoPort; fileStorage: FileStoragePort },
  input: { clipIds: string[] },
) {
  if (input.clipIds.length === 0) return;
  const deleted = await deps.audioClipRepo.deleteMany(deps.db, { clipIds: input.clipIds });
  await Promise.allSettled(
    deleted.map(({ storageKey }) => deps.fileStorage.deleteFile({ key: storageKey })),
  );
}
