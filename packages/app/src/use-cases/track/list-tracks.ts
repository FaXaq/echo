import type { TrackRepoPort } from "../../ports/track";

export const makeListTracks =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { songId: string }) => {
    return deps.trackRepo.list({ songId: input.songId });
  };
