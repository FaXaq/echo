import type { AudioClipRepoPort } from "../../ports/audio-clip";
import type { TrackRepoPort } from "../../ports/track";
import { notFound, conflict } from "../../errors";

export const makeUpdateAudioClipPosition =
  (deps: { audioClipRepo: AudioClipRepoPort; trackRepo: TrackRepoPort }) =>
  async (input: { clipId: string; startMeasure: number; trackId?: string }) => {
    if (input.trackId !== undefined) {
      const clip = await deps.audioClipRepo.findById({ clipId: input.clipId });
      if (!clip) {
        throw notFound("AudioClip");
      }

      const currentTrack = await deps.trackRepo.findById({
        trackId: clip.trackId,
      });
      if (!currentTrack) {
        throw notFound("Track");
      }

      const targetTrack = await deps.trackRepo.findById({
        trackId: input.trackId,
      });
      if (!targetTrack) {
        throw notFound("Track");
      }

      if (currentTrack.songId !== targetTrack.songId) {
        throw conflict("Target track does not belong to the same song");
      }
    }

    return deps.audioClipRepo.updatePosition({
      clipId: input.clipId,
      startMeasure: input.startMeasure,
      trackId: input.trackId,
    });
  };
