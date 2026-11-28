import type { PreviewFolderDeleteQueryPortFactory } from "./preview-folder-delete.query.port.js";
import { selectFolderAndDescendantIds } from "./common.js";

export const previewFolderDeleteQueryFactory: PreviewFolderDeleteQueryPortFactory =
  () => async (db, scope, input) => {
    const folderIds = await selectFolderAndDescendantIds(db, scope, input.id);
    if (folderIds.length === 0) return { deletedCount: 0, keptCount: 0 };

    const rows = await db
      .selectFrom("folder_file")
      .innerJoin("file", "file.id", "folder_file.file_id")
      .where("folder_file.folder_id", "in", folderIds)
      .where("file.organization_id", "=", scope.organizationId)
      .where("file.status", "=", "uploaded")
      .select(({ or, exists, selectFrom }) => [
        "file.id",
        or([
          exists(
            selectFrom("folder_file as other")
              .select("other.file_id")
              .whereRef("other.file_id", "=", "file.id")
              .where((inner) =>
                inner.or([
                  inner("other.folder_id", "is", null),
                  inner("other.folder_id", "not in", folderIds),
                ]),
              ),
          ),
          exists(
            selectFrom("event_file")
              .select("event_file.file_id")
              .whereRef("event_file.file_id", "=", "file.id"),
          ),
          exists(
            selectFrom("song_file")
              .select("song_file.file_id")
              .whereRef("song_file.file_id", "=", "file.id"),
          ),
        ]).as("kept"),
      ])
      .distinct()
      .execute();

    const keptCount = rows.filter((row) => row.kept).length;
    return { deletedCount: rows.length - keptCount, keptCount };
  };
