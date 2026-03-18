import type { AudioClipRepoPort } from "../../ports/audio-clip";
import type { FileStoragePort } from "../../ports/file-storage";

export const makeDeleteManyAudioClips =
  (deps: { audioClipRepo: AudioClipRepoPort; fileStorage: FileStoragePort }) =>
  async (input: { clipIds: string[] }) => {
    if (input.clipIds.length === 0) return;
    const deleted = await deps.audioClipRepo.deleteMany({ clipIds: input.clipIds });
    await Promise.allSettled(
      deleted.map(({ storageKey }) => deps.fileStorage.deleteFile({ key: storageKey })),
    );
  };
