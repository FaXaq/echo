import type { AudioClipRepoPort } from "../../ports/audio-clip";

export const makeUpdateAudioClipPosition =
  (deps: { audioClipRepo: AudioClipRepoPort }) =>
  async (input: { clipId: string; startMeasure: number }) => {
    return deps.audioClipRepo.updatePosition({
      clipId: input.clipId,
      startMeasure: input.startMeasure,
    });
  };
