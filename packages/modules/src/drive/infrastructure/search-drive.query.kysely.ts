import type { ExpressionBuilder } from "kysely";
import type { DB } from "@echo/db";
import { eventFolderName } from "../domain/index.js";
import { selectFolderPaths } from "./common.js";
import { selectFileOccurrences } from "./list-file-occurrences.query.kysely.js";
import type { SearchDriveQueryPortFactory, SearchDriveResult } from "./search-drive.query.port.js";
import { toFileRecord } from "./map-file.js";

const SEARCH_RESULT_LIMIT = 10;

const containing = (query: string) => `%${query.replace(/[\\%_]/g, "\\$&")}%`;

const titleContains = (query: string) => (eb: ExpressionBuilder<DB, "calendar_event" | "song">) =>
  eb("title", "ilike", containing(query));

export const searchDriveQueryFactory: SearchDriveQueryPortFactory =
  () => async (db, scope, input) => {
    const [folderRows, eventRows, songRows, fileRows] = await Promise.all([
      db
        .selectFrom("folder")
        .select(["id", "name", "parent_folder_id"])
        .where("organization_id", "=", scope.organizationId)
        .where("name", "ilike", containing(input.query))
        .orderBy("name")
        .limit(SEARCH_RESULT_LIMIT)
        .execute(),
      db
        .selectFrom("calendar_event")
        .select(["id", "title", "start_date"])
        .where("organization_id", "=", scope.organizationId)
        .where(titleContains(input.query))
        .orderBy("title")
        .limit(SEARCH_RESULT_LIMIT)
        .execute(),
      db
        .selectFrom("song")
        .select(["id", "title"])
        .where("organization_id", "=", scope.organizationId)
        .where(titleContains(input.query))
        .orderBy("title")
        .limit(SEARCH_RESULT_LIMIT)
        .execute(),
      db
        .selectFrom("file")
        .innerJoin("user", "user.id", "file.uploaded_by")
        .selectAll("file")
        .select("user.name as uploaded_by_name")
        .where("file.organization_id", "=", scope.organizationId)
        .where("file.status", "=", "uploaded")
        .where("file.filename", "ilike", containing(input.query))
        .orderBy("file.filename")
        .limit(SEARCH_RESULT_LIMIT)
        .execute(),
    ]);

    const [parentPaths, occurrences] = await Promise.all([
      selectFolderPaths(
        db,
        scope,
        folderRows.flatMap((row) => (row.parent_folder_id === null ? [] : [row.parent_folder_id])),
      ),
      selectFileOccurrences(
        db,
        scope,
        fileRows.map((row) => row.id),
      ),
    ]);

    const folders: SearchDriveResult["folders"] = [
      ...folderRows.map((row): SearchDriveResult["folders"][number] => ({
        location: { kind: "folder", id: row.id },
        name: row.name,
        path:
          row.parent_folder_id === null
            ? []
            : (parentPaths.get(row.parent_folder_id) ?? []).map((segment) => segment.name),
      })),
      ...eventRows.map((row): SearchDriveResult["folders"][number] => ({
        location: { kind: "event", id: row.id },
        name: eventFolderName({ title: row.title, startDate: row.start_date }),
        path: ["Events"],
      })),
      ...songRows.map((row): SearchDriveResult["folders"][number] => ({
        location: { kind: "song", id: row.id },
        name: row.title,
        path: ["Songs"],
      })),
    ]
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, SEARCH_RESULT_LIMIT);

    return {
      folders,
      files: fileRows.map((row) => {
        const [oldest] = occurrences[row.id] ?? [];
        return {
          ...toFileRecord(row),
          location: oldest?.place ?? { kind: "root" },
          path: oldest?.path ?? [],
        };
      }),
    };
  };
