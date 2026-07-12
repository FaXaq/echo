import type { KyselyDB } from "@echo/db";
import type { SongSectionInstanceRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function deleteSectionInstance(
  deps: { db: KyselyDB; instanceRepo: SongSectionInstanceRepoPort },
  input: { id: string },
) {
  const existing = await deps.instanceRepo.get(deps.db, { id: input.id });
  if (!existing) throw notFound("SongSectionInstance");
  await deps.instanceRepo.delete(deps.db, { id: input.id });
}
