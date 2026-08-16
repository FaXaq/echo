import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export const makeSelectFileByIdQuery = (db: KyselyDB) => (scope: OrganizationScope, id: string) => {
  return db
    .selectFrom("file")
    .selectAll()
    .leftJoin("user", "user.id", "file.uploaded_by")
    .select("user.name as uploaded_by_name")
    .where("file.id", "=", id)
    .where("file.organization_id", "=", scope.organizationId)
    .executeTakeFirst();
};
