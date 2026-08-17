import type { Selectable } from "kysely";
import type { FolderRecord } from "../domain/index.js";
import type { DB } from "@echo/db";

export type FolderRow = Selectable<DB["folder"]>;

export function toFolderRecord(row: FolderRow): FolderRecord {
  return {
    id: row.id,
    organizationId: row.organization_id,
    parentFolderId: row.parent_folder_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
