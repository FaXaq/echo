import type { KyselyDB } from "@echo/db";
import type { SongSectionInstanceRepoPort } from "../infrastructure/index.js";

export async function listSectionInstances(
  deps: { db: KyselyDB; instanceRepo: SongSectionInstanceRepoPort },
  input: { songId: string },
) {
  return deps.instanceRepo.list(deps.db, { songId: input.songId });
}
