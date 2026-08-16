import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import { toFileRecord } from "./map-file.js";

export async function listFilesByOrganization(
  db: KyselyDB,
  scope: OrganizationScope,
): Promise<FileRecord[]> {
  const rows = await db
    .selectFrom("file")
    .innerJoin("user", "file.uploaded_by", "user.id")
    .selectAll("file")
    .select("user.name as uploaded_by_name")
    .where("organization_id", "=", scope.organizationId)
    .execute();

  return rows.map((row) => toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
}
