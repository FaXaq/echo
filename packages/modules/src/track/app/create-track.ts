import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort } from "../infrastructure/index.js";

export async function createTrack(
  deps: { db: KyselyDB; trackRepo: TrackRepoPort },
  input: { songId: string; name: string; volume?: number },
) {
  const existing = await deps.trackRepo.list(deps.db, { songId: input.songId });
  const order = existing.length + 1;
  const volume = input.volume ?? 0;
  return deps.trackRepo.create(deps.db, {
    id: crypto.randomUUID(),
    songId: input.songId,
    name: input.name,
    volume,
    order,
  });
}
