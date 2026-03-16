import type { SongRepoPort } from "../../ports/song";
import { notFound } from "../../errors";

export const makeUpdateSong =
  (deps: { songRepo: SongRepoPort }) =>
  async (input: { songId: string; bpm?: number; key?: string | null }) => {
    const song = await deps.songRepo.get({ songId: input.songId });
    if (!song) throw notFound("Song");
    return deps.songRepo.update(input);
  };
