import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";
import { makeSelectFileByIdQuery } from "./common.js";

export async function markFileUploaded(
  db: KyselyDB,
  scope: OrganizationScope,
  id: string,
  sizeBytes: number | null,
): Promise<FileRecord | null> {
  const row = await db.transaction().execute(async (trx) => {
    const updated = await trx
      .updateTable("file")
      .set({
        status: "uploaded",
        updated_at: new Date(),
        ...(sizeBytes === null ? {} : { size_bytes: sizeBytes }),
      })
      .where("id", "=", id)
      .where("organization_id", "=", scope.organizationId)
      .returning("id")
      .executeTakeFirst();

    if (!updated) return undefined;

    const selectFileById = makeSelectFileByIdQuery(trx);

    return await selectFileById(scope, updated.id);
  });

  return row ? toFileRecord(row) : null;
}
