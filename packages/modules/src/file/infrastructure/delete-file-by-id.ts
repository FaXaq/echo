import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export async function deleteFileById(
  db: KyselyDB,
  scope: OrganizationScope,
  id: string,
): Promise<boolean> {
  const result = await db
    .deleteFrom("file")
    .where("id", "=", id)
    .where("organization_id", "=", scope.organizationId)
    .executeTakeFirst();
  return result.numDeletedRows > 0n;
}
