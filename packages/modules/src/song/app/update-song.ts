import type { KyselyDB } from "@echo/db";
import type { SongRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function updateSong(
  deps: { db: KyselyDB; songRepo: SongRepoPort },
  input: { songId: string; bpm?: number; key?: string | null },
) {
  const song = await deps.songRepo.get(deps.db, { songId: input.songId });
  if (!song) throw notFound("Song");
  return deps.songRepo.update(deps.db, input);
}
