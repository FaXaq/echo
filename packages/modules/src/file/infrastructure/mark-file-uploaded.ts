import type { KyselyDB } from "@echo/db";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";
import { makeSelectFileByIdQuery } from "./common.js";

export async function markFileUploaded(db: KyselyDB, id: string): Promise<FileRecord | null> {
  const row = await db
    .transaction()
    .execute(async (trx) => {
      const { id: fileId } = await trx.updateTable("file")
        .set({ status: "uploaded", updated_at: new Date() })
        .where("id", "=", id)
        .returning("id")
        .executeTakeFirstOrThrow();

      const selectFileById = makeSelectFileByIdQuery(trx);

      return await selectFileById(fileId);
    })

  return row ? toFileRecord(row) : null;
}
