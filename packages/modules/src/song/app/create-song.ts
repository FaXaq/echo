import type { KyselyDB } from "@echo/db";
import type { SongRepoPort } from "../infrastructure/index.js";
import type { OrganizationRepoPort } from "../../organization/infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function createSong(
  deps: { db: KyselyDB; songRepo: SongRepoPort; organizationRepo: OrganizationRepoPort },
  input: { organizationSlug: string; name: string; createdBy: string; key?: string | null },
) {
  const org = await deps.organizationRepo.get({ slug: input.organizationSlug });
  if (!org) throw notFound("Organization");
  return deps.songRepo.create(deps.db, {
    id: crypto.randomUUID(),
    name: input.name,
    organizationId: org.id,
    createdBy: input.createdBy,
    key: input.key,
  });
}
