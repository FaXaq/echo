import type { AudioClipRepoPort } from "../../ports/audio-clip";
import type { FileStoragePort } from "../../ports/file-storage";

export const makeDeleteAudioClip =
  (deps: { audioClipRepo: AudioClipRepoPort; fileStorage: FileStoragePort }) =>
  async (input: { clipId: string; storageKey: string }) => {
    await deps.audioClipRepo.delete({ clipId: input.clipId });
    await deps.fileStorage.deleteFile({ key: input.storageKey });
  };
