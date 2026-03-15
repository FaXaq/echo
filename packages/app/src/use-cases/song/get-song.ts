import type { SongRepoPort } from "../../ports/song";
import { notFound } from "../../errors";

export const makeGetSong =
  (deps: { songRepo: SongRepoPort }) =>
  async (input: { songId: string }) => {
    const song = await deps.songRepo.get({ songId: input.songId });
    if (!song) throw notFound("Song");
    return song;
  };
