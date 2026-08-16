import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";
import { makeSelectFileByIdQuery } from "./common.js";

export async function renameFileById(
  db: KyselyDB,
  scope: OrganizationScope,
  id: string,
  filename: string,
): Promise<FileRecord | null> {
  const row = await db.transaction().execute(async (trx) => {
    const updated = await trx
      .updateTable("file")
      .set({ filename: filename, updated_at: new Date() })
      .where("id", "=", id)
      .where("organization_id", "=", scope.organizationId)
      .returning("file.id")
      .executeTakeFirst();

    if (!updated) return undefined;

    const selectFileById = makeSelectFileByIdQuery(trx);

    return await selectFileById(scope, updated.id);
  });

  return row ? toFileRecord(row) : null;
}
