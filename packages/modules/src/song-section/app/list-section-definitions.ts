import type { KyselyDB } from "@echo/db";
import type { SongSectionDefinitionRepoPort } from "../infrastructure/index.js";

export async function listSectionDefinitions(
  deps: { db: KyselyDB; definitionRepo: SongSectionDefinitionRepoPort },
  input: { songId: string },
) {
  return deps.definitionRepo.list(deps.db, { songId: input.songId });
}
