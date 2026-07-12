import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";
import { conflict } from "@echo/errors";

export async function updateTrackVolume(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { trackId: string; volumeDb: number },
) {
  if (input.volumeDb < -60 || input.volumeDb > 6) {
    throw conflict("Volume must be between -60 dB and +6 dB");
  }
  return deps.trackRepo.updateVolume(deps.db, {
    trackId: input.trackId,
    volumeDb: input.volumeDb,
  });
}
