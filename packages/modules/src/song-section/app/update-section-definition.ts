import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinitionRepoPort, SongChord } from "../infrastructure/index.js";
import { notFound } from "@echo/errors";

export async function updateSectionDefinition(
  deps: { db: KyselyDB; definitionRepo: SongSectionDefinitionRepoPort },
  input: {
    id: string;
    name?: string;
    chords?: SongChord[];
    lyrics?: string | null;
    color?: string | null;
  },
) {
  const existing = await deps.definitionRepo.get(deps.db, { id: input.id });
  if (!existing) throw notFound("SongSectionDefinition");
  return deps.definitionRepo.update(deps.db, input);
}
