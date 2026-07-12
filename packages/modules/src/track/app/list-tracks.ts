import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";

export async function listTracks(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { songId: string },
) {
  return deps.trackRepo.list(deps.db, { songId: input.songId });
}
