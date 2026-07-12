import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";

export async function renameTrack(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { trackId: string; name: string },
) {
  return deps.trackRepo.rename(deps.db, input);
}
