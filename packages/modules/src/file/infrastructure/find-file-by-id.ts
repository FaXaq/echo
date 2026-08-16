import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";
import { makeSelectFileByIdQuery } from "./common.js";

export async function findFileById(
  db: KyselyDB,
  scope: OrganizationScope,
  id: string,
): Promise<FileRecord | null> {
  const selectFileById = makeSelectFileByIdQuery(db);

  const row = await selectFileById(scope, id);

  return row ? toFileRecord(row) : null;
}
