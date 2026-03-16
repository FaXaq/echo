import type { AudioClipRepoPort, AudioClip } from "../../ports/audio-clip";

export const makeRenameAudioClip =
  (deps: { audioClipRepo: AudioClipRepoPort }) =>
  async (input: { clipId: string; name: string }): Promise<AudioClip> =>
    deps.audioClipRepo.rename(input);
