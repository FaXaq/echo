import { sql } from "kysely";
import type { SearchDriveQueryPortFactory } from "./search-drive.query.port.js";
import { toFileRecord, type FileRow } from "./map-file.js";
import { toFolderRecord, type FolderRow } from "./map-folder.js";

const SEARCH_RESULT_LIMIT = 10;

// Each query below inlines its own copy of this recursive CTE — it computes
// every folder's full ancestor path (root-first, including itself) so the
// file/folder searches can look up a location with one join instead of
// walking parents per row. Kysely's `sql` tagged template can't share a
// parameterized fragment across two separate `.execute()` calls without
// re-binding `scope.organizationId`, so duplicating this small CTE is
// simpler than fighting that.
export const searchDriveQueryFactory: SearchDriveQueryPortFactory =
  () => async (db, scope, input) => {
    const folderRows = await sql<FolderRow & { path: string[] }>`
    WITH RECURSIVE folder_path AS (
      SELECT id, name, parent_folder_id, ARRAY[name] AS path
      FROM folder
      WHERE organization_id = ${scope.organizationId} AND parent_folder_id IS NULL
      UNION ALL
      SELECT f.id, f.name, f.parent_folder_id, fp.path || f.name
      FROM folder f
      INNER JOIN folder_path fp ON f.parent_folder_id = fp.id
    )
    SELECT folder.*, COALESCE(parent_fp.path, ARRAY[]::text[]) AS path
    FROM folder
    LEFT JOIN folder_path parent_fp ON parent_fp.id = folder.parent_folder_id
    WHERE folder.organization_id = ${scope.organizationId}
      AND strpos(lower(folder.name), lower(${input.query})) > 0
    ORDER BY folder.name ASC
    LIMIT ${SEARCH_RESULT_LIMIT}
  `.execute(db);

    const fileRows = await sql<FileRow & { path: string[] }>`
    WITH RECURSIVE folder_path AS (
      SELECT id, name, parent_folder_id, ARRAY[name] AS path
      FROM folder
      WHERE organization_id = ${scope.organizationId} AND parent_folder_id IS NULL
      UNION ALL
      SELECT f.id, f.name, f.parent_folder_id, fp.path || f.name
      FROM folder f
      INNER JOIN folder_path fp ON f.parent_folder_id = fp.id
    )
    SELECT file.*, "user".name AS uploaded_by_name, COALESCE(folder_path.path, ARRAY[]::text[]) AS path
    FROM file
    INNER JOIN "user" ON "user".id = file.uploaded_by
    LEFT JOIN folder_path ON folder_path.id = file.folder_id
    WHERE file.organization_id = ${scope.organizationId}
      AND file.status = 'uploaded'
      AND strpos(lower(file.filename), lower(${input.query})) > 0
    ORDER BY file.filename ASC
    LIMIT ${SEARCH_RESULT_LIMIT}
  `.execute(db);

    return {
      folders: folderRows.rows.map((row) => ({ ...toFolderRecord(row), path: row.path })),
      files: fileRows.rows.map((row) => ({ ...toFileRecord(row), path: row.path })),
    };
  };
