import type { TrackRepoPort } from "../../ports/track";
import { conflict } from "../../errors";

export const makeSetTrackInstrumentPreset =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { trackId: string; preset: number | null }) => {
    if (
      input.preset !== null &&
      (input.preset < 0 || input.preset > 127 || !Number.isInteger(input.preset))
    ) {
      throw conflict("Instrument preset must be an integer between 0 and 127");
    }
    return deps.trackRepo.setInstrumentPreset({
      trackId: input.trackId,
      preset: input.preset,
    });
  };
