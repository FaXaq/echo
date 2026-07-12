import type { KyselyDB } from "@echo/db";
import type { SongRepoPort } from "../infrastructure/index.js";
import type { OrganizationRepoPort } from "../../organization/infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function listSongs(
  deps: { db: KyselyDB; songRepo: SongRepoPort; organizationRepo: OrganizationRepoPort },
  input: { organizationSlug: string },
) {
  const org = await deps.organizationRepo.get({ slug: input.organizationSlug });
  if (!org) throw notFound("Organization");
  return deps.songRepo.list(deps.db, { organizationId: org.id });
}
