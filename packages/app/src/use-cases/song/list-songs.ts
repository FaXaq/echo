import type { SongRepoPort } from "../../ports/song";
import type { OrganizationRepoPort } from "../../ports/organization";
import { notFound } from "../../errors";

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
