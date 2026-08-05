import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";

export async function markFileUploaded(db: KyselyDB, id: string): Promise<FileRecord | null> {
  const row = await db
    .updateTable("file")
    .set({ status: "uploaded", updated_at: new Date() })
    .where("id", "=", id)
    .returningAll()
    .executeTakeFirst();

  return row ? toFileRecord(row) : null;
}
