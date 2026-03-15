import type { TrackRepoPort } from "../../ports/track";
import { conflict } from "../../errors";

export const makeUpdateTrackVolume =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { trackId: string; volume: number }) => {
    if (input.volume < 0 || input.volume > 100) {
      throw conflict("Volume must be between 0 and 100");
    }
    return deps.trackRepo.updateVolume({
      trackId: input.trackId,
      volume: input.volume,
    });
  };
