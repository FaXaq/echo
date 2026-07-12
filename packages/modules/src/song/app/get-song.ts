import type { KyselyDB } from "@echo/db";
import type { SongRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function getSong(
  deps: { db: KyselyDB; songRepo: SongRepoPort },
  input: { songId: string },
) {
  const song = await deps.songRepo.get(deps.db, { songId: input.songId });
  if (!song) throw notFound("Song");
  return song;
}
