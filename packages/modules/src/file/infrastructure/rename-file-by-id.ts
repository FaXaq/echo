import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";
import { makeSelectFileByIdQuery } from "./common.js";

export async function renameFileById(
  db: KyselyDB,
  id: string,
  filename: string,
): Promise<FileRecord | null> {
  const row = await db.transaction().execute(async (trx) => {
    const { id: fileId } = await trx
      .updateTable("file")
      .set({ filename: filename, updated_at: new Date() })
      .where("id", "=", id)
      .returning("file.id")
      .executeTakeFirstOrThrow();

    const selectFileById = makeSelectFileByIdQuery(trx);

    return await selectFileById(fileId);
  });

  return row ? toFileRecord(row) : null;
}
