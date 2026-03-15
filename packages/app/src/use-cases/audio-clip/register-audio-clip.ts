import type { AudioClipRepoPort } from "../../ports/audio-clip";

export const makeRegisterAudioClip =
  (deps: { audioClipRepo: AudioClipRepoPort }) =>
  async (input: {
    trackId: string;
    filename: string;
    storageKey: string;
    startMeasure: number;
    durationMs?: number | null;
  }) => {
    return deps.audioClipRepo.create({
      id: crypto.randomUUID(),
      trackId: input.trackId,
      filename: input.filename,
      storageKey: input.storageKey,
      durationMs: input.durationMs,
      startMeasure: input.startMeasure,
    });
  };
