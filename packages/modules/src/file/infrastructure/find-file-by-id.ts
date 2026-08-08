import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";
import { makeSelectFileByIdQuery } from "./common.js";

export async function findFileById(db: KyselyDB, id: string): Promise<FileRecord | null> {
  const selectFileById = makeSelectFileByIdQuery(db);

  const row = await selectFileById(id);

  return row ? toFileRecord(row) : null;
}
