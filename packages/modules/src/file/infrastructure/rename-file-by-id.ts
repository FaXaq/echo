import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";

export async function renameFileById(
  db: KyselyDB,
  id: string,
  filename: string,
): Promise<FileRecord | null> {
  const row = await db
    .updateTable("file")
    .set({ original_filename: filename, updated_at: new Date() })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();

  return row ? toFileRecord(row) : null;
}
