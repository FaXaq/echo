import type { TrackRepoPort } from "../../ports/track";
import { conflict } from "../../errors";

export const makeUpdateTrackVolume =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { trackId: string; volumeDb: number }) => {
    if (input.volumeDb < -60 || input.volumeDb > 6) {
      throw conflict("Volume must be between -60 dB and +6 dB");
    }
    return deps.trackRepo.updateVolume({
      trackId: input.trackId,
      volumeDb: input.volumeDb,
    });
  };
