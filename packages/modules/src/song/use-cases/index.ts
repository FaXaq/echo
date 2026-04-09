import type { SongRepoPort } from "../infrastructure/index.js";
import type { OrganizationRepoPort } from "../../organization/infrastructure/index.js";
import { notFound } from "@echo/errors";

export const makeCreateSong =
  (deps: {
    songRepo: SongRepoPort;
    organizationRepo: OrganizationRepoPort;
  }) =>
  async (input: { organizationSlug: string; name: string; createdBy: string; key?: string | null }) => {
    const org = await deps.organizationRepo.get({ slug: input.organizationSlug });
    if (!org) throw notFound("Organization");
    return deps.songRepo.create({
      id: crypto.randomUUID(),
      name: input.name,
      organizationId: org.id,
      createdBy: input.createdBy,
      key: input.key,
    });
  };

export const makeGetSong =
  (deps: { songRepo: SongRepoPort }) =>
  async (input: { songId: string }) => {
    const song = await deps.songRepo.get({ songId: input.songId });
    if (!song) throw notFound("Song");
    return song;
  };

export const makeListSongs =
  (deps: {
    songRepo: SongRepoPort;
    organizationRepo: OrganizationRepoPort;
  }) =>
  async (input: { organizationSlug: string }) => {
    const org = await deps.organizationRepo.get({ slug: input.organizationSlug });
    if (!org) throw notFound("Organization");
    return deps.songRepo.list({ organizationId: org.id });
  };

export const makeUpdateSong =
  (deps: { songRepo: SongRepoPort }) =>
  async (input: { songId: string; bpm?: number; key?: string | null }) => {
    const song = await deps.songRepo.get({ songId: input.songId });
    if (!song) throw notFound("Song");
    return deps.songRepo.update(input);
  };
