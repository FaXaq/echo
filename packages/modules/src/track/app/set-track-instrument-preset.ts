import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";
import { conflict } from "@echo/errors";

export async function setTrackInstrumentPreset(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { trackId: string; preset: number | null },
) {
  if (
    input.preset !== null &&
    (input.preset < 0 || input.preset > 127 || !Number.isInteger(input.preset))
  ) {
    throw conflict("Instrument preset must be an integer between 0 and 127");
  }
  return deps.trackRepo.setInstrumentPreset(deps.db, {
    trackId: input.trackId,
    preset: input.preset,
  });
}
