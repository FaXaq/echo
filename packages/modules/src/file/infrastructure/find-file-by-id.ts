import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";

export async function findFileById(db: KyselyDB, id: string): Promise<FileRecord | null> {
  const row = await db.selectFrom("file").selectAll().where("id", "=", id).executeTakeFirst();
  return row ? toFileRecord(row) : null;
}
