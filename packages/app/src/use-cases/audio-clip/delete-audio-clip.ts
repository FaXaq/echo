import type { AudioClipRepoPort } from "../../ports/audio-clip";
import type { FileStoragePort } from "../../ports/file-storage";
import { notFound } from "../../errors";

export const makeDeleteAudioClip =
  (deps: { audioClipRepo: AudioClipRepoPort; fileStorage: FileStoragePort }) =>
  async (input: { clipId: string }) => {
    const clip = await deps.audioClipRepo.findById({ clipId: input.clipId });
    if (!clip) throw notFound("AudioClip");
    await deps.audioClipRepo.delete({ clipId: input.clipId });
    await deps.fileStorage.deleteFile({ key: clip.file.storageKey });
  };
