import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinitionRepoPort, SongChord } from "../infrastructure/index.js";

export async function createSectionDefinition(
  deps: { db: KyselyDB; definitionRepo: SongSectionDefinitionRepoPort },
  input: {
    songId: string;
    name: string;
    chords?: SongChord[];
    lyrics?: string | null;
    color?: string | null;
  },
) {
  return deps.definitionRepo.create(deps.db, {
    id: crypto.randomUUID(),
    songId: input.songId,
    name: input.name,
    chords: input.chords ?? [],
    lyrics: input.lyrics ?? null,
    color: input.color ?? null,
  });
}
