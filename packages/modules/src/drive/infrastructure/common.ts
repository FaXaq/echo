import type { DB, KyselyDB } from "@echo/db";
import { sql, type ExpressionBuilder } from "kysely";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export function songAndFileBelongToOrganization<TB extends keyof DB>(
  eb: ExpressionBuilder<DB, TB>,
  db: KyselyDB,
  scope: OrganizationScope,
  songId: string,
  fileId: string,
) {
  return eb.and([
    eb.exists(
      db
        .selectFrom("song")
        .select("song.id")
        .where("song.id", "=", songId)
        .where("song.organization_id", "=", scope.organizationId),
    ),
    eb.exists(
      db
        .selectFrom("file")
        .select("file.id")
        .where("file.id", "=", fileId)
        .where("file.organization_id", "=", scope.organizationId),
    ),
  ]);
}

export const makeSelectFileByIdQuery = (db: KyselyDB) => (scope: OrganizationScope, id: string) => {
  return db
    .selectFrom("file")
    .selectAll("file")
    .leftJoin("user", "user.id", "file.uploaded_by")
    .select("user.name as uploaded_by_name")
    .where("file.id", "=", id)
    .where("file.organization_id", "=", scope.organizationId)
    .executeTakeFirst();
};

export const makeSelectFilesByIdsQuery =
  (db: KyselyDB) => (scope: OrganizationScope, ids: string[]) => {
    return db
      .selectFrom("file")
      .selectAll("file")
      .leftJoin("user", "user.id", "file.uploaded_by")
      .select("user.name as uploaded_by_name")
      .where("file.id", "in", ids)
      .where("file.organization_id", "=", scope.organizationId)
      .execute();
  };

export const makeSelectFolderByIdQuery =
  (db: KyselyDB) => (scope: OrganizationScope, id: string) => {
    return db
      .selectFrom("folder")
      .selectAll()
      .where("id", "=", id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();
  };

export const makeSelectFolderByParentAndNameQuery =
  (db: KyselyDB) => (scope: OrganizationScope, parentFolderId: string | null, name: string) => {
    let query = db
      .selectFrom("folder")
      .selectAll()
      .where("organization_id", "=", scope.organizationId)
      .where(sql`lower(name)`, "=", name.toLowerCase());

    query =
      parentFolderId === null
        ? query.where("parent_folder_id", "is", null)
        : query.where("parent_folder_id", "=", parentFolderId);

    return query.executeTakeFirst();
  };

type FolderIdRow = { id: string };

export const selectFolderAndDescendantIds = async (
  db: KyselyDB,
  scope: OrganizationScope,
  rootId: string,
): Promise<string[]> => {
  const result = await sql<FolderIdRow>`
    WITH RECURSIVE descendants AS (
      SELECT id FROM folder WHERE id = ${rootId} AND organization_id = ${scope.organizationId}
      UNION ALL
      SELECT f.id FROM folder f
      INNER JOIN descendants d ON f.parent_folder_id = d.id
    )
    SELECT id FROM descendants
  `.execute(db);

  return result.rows.map((row) => row.id);
};
