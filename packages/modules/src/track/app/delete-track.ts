import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";

export async function deleteTrack(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { trackId: string },
) {
  return deps.trackRepo.delete(deps.db, { trackId: input.trackId });
}
