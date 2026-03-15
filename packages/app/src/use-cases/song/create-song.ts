import type { SongRepoPort } from "../../ports/song";
import type { OrganizationRepoPort } from "../../ports/organization";
import { notFound } from "../../errors";

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
