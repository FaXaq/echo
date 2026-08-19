import type { ListFolderContentsQueryPortFactory } from "./list-folder-contents.query.port.js";
import { toFolderRecord } from "./map-folder.js";
import { toFileRecord } from "./map-file.js";

const FILE_SORT_COLUMN = {
  name: "file.filename",
  event: "calendar_event.title",
  updatedAt: "file.updated_at",
  sizeBytes: "file.size_bytes",
} as const;

export const listFolderContentsQueryFactory: ListFolderContentsQueryPortFactory =
  () => async (db, scope, input) => {
    let folderQuery = db
      .selectFrom("folder")
      .selectAll()
      .where("organization_id", "=", scope.organizationId);
    folderQuery =
      input.folderId === null
        ? folderQuery.where("parent_folder_id", "is", null)
        : folderQuery.where("parent_folder_id", "=", input.folderId);
    // Folders have no event or size — any field besides name/updatedAt
    // falls back to name, since "sort folders by size" isn't meaningful.
    const folderSortColumn = input.sort.field === "updatedAt" ? "updated_at" : "name";
    folderQuery = folderQuery.orderBy(folderSortColumn, input.sort.order);

    let fileQuery = db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .leftJoin("calendar_event", "file.event_id", "calendar_event.id")
      .selectAll("file")
      .select(["user.name as uploaded_by_name", "calendar_event.title as event_title"])
      .where("file.organization_id", "=", scope.organizationId);
    fileQuery =
      input.folderId === null
        ? fileQuery.where("folder_id", "is", null)
        : fileQuery.where("folder_id", "=", input.folderId);
    fileQuery = fileQuery.orderBy(FILE_SORT_COLUMN[input.sort.field], input.sort.order);

    const [folderRows, fileRows] = await Promise.all([folderQuery.execute(), fileQuery.execute()]);

    return {
      folders: folderRows.map(toFolderRecord),
      files: fileRows.map((row) =>
        toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }),
      ),
    };
  };
