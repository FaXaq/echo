import type { MidiClipRepoPort } from "../../ports/midi-clip";
import type { TrackRepoPort } from "../../ports/track";
import { notFound, conflict } from "../../errors";

export const makeUpdateMidiClipPosition =
  (deps: { midiClipRepo: MidiClipRepoPort; trackRepo: TrackRepoPort }) =>
  async (input: { clipId: string; startMeasure: number; trackId?: string }) => {
    if (input.startMeasure < 1) {
      throw conflict("Start measure must be >= 1");
    }

    if (input.trackId !== undefined) {
      const clip = await deps.midiClipRepo.findById({ clipId: input.clipId });
      if (!clip) {
        throw notFound("MidiClip");
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

    return deps.midiClipRepo.updatePosition({
      clipId: input.clipId,
      startMeasure: input.startMeasure,
      trackId: input.trackId,
    });
  };
