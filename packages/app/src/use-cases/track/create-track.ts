import type { TrackRepoPort } from "../../ports/track";

export const makeCreateTrack =
  (deps: { trackRepo: TrackRepoPort }) =>
  async (input: { songId: string; name: string; volume?: number }) => {
    const existing = await deps.trackRepo.list({ songId: input.songId });
    const order = existing.length + 1;
    const volume = input.volume ?? 80;
    return deps.trackRepo.create({
      id: crypto.randomUUID(),
      songId: input.songId,
      name: input.name,
      volume,
      order,
    });
  };
