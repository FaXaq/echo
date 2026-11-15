import type { DB, KyselyDB } from "@echo/db";
import type { ExpressionBuilder } from "kysely";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FolderPathSegment } from "./find-folder-path.query.port.js";

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

export const makeSelectFoldersByParentAndNamesQuery =
  (db: KyselyDB) => (scope: OrganizationScope, parentFolderId: string | null, names: string[]) => {
    if (names.length === 0) return Promise.resolve([]);
    const query = db
      .selectFrom("folder")
      .selectAll()
      .where("organization_id", "=", scope.organizationId)
      .where(
        (eb) => eb.fn<string>("lower", ["name"]),
        "in",
        names.map((name) => name.toLowerCase()),
      );

    return (
      parentFolderId === null
        ? query.where("parent_folder_id", "is", null)
        : query.where("parent_folder_id", "=", parentFolderId)
    ).execute();
  };

export const selectFolderAndDescendantIds = async (
  db: KyselyDB,
  scope: OrganizationScope,
  rootId: string,
) => {
  const rows = await db
    .withRecursive("descendant(id)", (db) =>
      db
        .selectFrom("folder")
        .select("id")
        .where("id", "=", rootId)
        .where("organization_id", "=", scope.organizationId)
        .unionAll((db) =>
          db
            .selectFrom("folder")
            .innerJoin("descendant", "descendant.id", "folder.parent_folder_id")
            .select("folder.id"),
        ),
    )
    .selectFrom("descendant")
    .select("id")
    .execute();

  return rows.map((row) => row.id);
};

export const selectFolderPaths = async (
  db: KyselyDB,
  scope: OrganizationScope,
  folderIds: string[],
) => {
  const paths = new Map<string, FolderPathSegment[]>();
  if (folderIds.length === 0) return paths;

  const rows = await db
    .withRecursive("ancestor(leaf_id, id, name, parent_folder_id, depth)", (db) =>
      db
        .selectFrom("folder")
        .select((eb) => ["id as leaf_id", "id", "name", "parent_folder_id", eb.lit(0).as("depth")])
        .where("id", "in", folderIds)
        .where("organization_id", "=", scope.organizationId)
        .unionAll((db) =>
          db
            .selectFrom("folder")
            .innerJoin("ancestor", "ancestor.parent_folder_id", "folder.id")
            .select((eb) => [
              "ancestor.leaf_id",
              "folder.id",
              "folder.name",
              "folder.parent_folder_id",
              eb("ancestor.depth", "+", eb.lit(1)).as("depth"),
            ]),
        ),
    )
    .selectFrom("ancestor")
    .select(["leaf_id", "id", "name"])
    .orderBy("leaf_id")
    .orderBy("depth", "desc")
    .execute();

  for (const row of rows) {
    const path = paths.get(row.leaf_id) ?? [];
    path.push({ id: row.id, name: row.name });
    paths.set(row.leaf_id, path);
  }
  return paths;
};
