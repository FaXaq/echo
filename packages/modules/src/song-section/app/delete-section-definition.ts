import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinitionRepoPort } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function deleteSectionDefinition(
  deps: { db: KyselyDB; definitionRepo: SongSectionDefinitionRepoPort },
  input: { id: string },
) {
  const existing = await deps.definitionRepo.get(deps.db, { id: input.id });
  if (!existing) throw notFound("SongSectionDefinition");
  await deps.definitionRepo.delete(deps.db, { id: input.id });
}
