import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { eventFolderName, type PlaceLabel } from "../domain/index.js";
import { selectFolderPaths } from "./common.js";
import type { ListFileOccurrencesQueryPortFactory } from "./list-file-occurrences.query.port.js";

type Occurrence = { fileId: string; at: Date; label: PlaceLabel };

const placeOrder = { event: 0, root: 1, folder: 1, song: 2 };

const byOldest = (a: Occurrence, b: Occurrence) =>
  a.at.getTime() - b.at.getTime() ||
  placeOrder[a.label.place.kind] - placeOrder[b.label.place.kind] ||
  ("id" in a.label.place ? a.label.place.id : "").localeCompare(
    "id" in b.label.place ? b.label.place.id : "",
  );

export const selectFileOccurrences = async (
  db: KyselyDB,
  scope: OrganizationScope,
  fileIds: string[],
) => {
  const byFile: Record<string, PlaceLabel[]> = {};
  if (fileIds.length === 0) return byFile;

  const [folderRows, eventRows, songRows] = await Promise.all([
    db
      .selectFrom("folder_file")
      .innerJoin("file", "file.id", "folder_file.file_id")
      .select(["folder_file.file_id", "folder_file.folder_id", "folder_file.placed_at as at"])
      .where("folder_file.file_id", "in", fileIds)
      .where("file.organization_id", "=", scope.organizationId)
      .execute(),
    db
      .selectFrom("event_file")
      .innerJoin("calendar_event", "calendar_event.id", "event_file.event_id")
      .innerJoin("file", "file.id", "event_file.file_id")
      .select([
        "event_file.file_id",
        "calendar_event.id",
        "calendar_event.title",
        "calendar_event.start_date",
        "event_file.linked_at as at",
      ])
      .where("event_file.file_id", "in", fileIds)
      .where("file.organization_id", "=", scope.organizationId)
      .execute(),
    db
      .selectFrom("song_file")
      .innerJoin("song", "song.id", "song_file.song_id")
      .innerJoin("file", "file.id", "song_file.file_id")
      .select(["song_file.file_id", "song.id", "song.title", "song_file.linked_at as at"])
      .where("song_file.file_id", "in", fileIds)
      .where("file.organization_id", "=", scope.organizationId)
      .execute(),
  ]);

  const folderPaths = await selectFolderPaths(
    db,
    scope,
    folderRows.flatMap((row) => (row.folder_id === null ? [] : [row.folder_id])),
  );

  const occurrences: Occurrence[] = [
    ...folderRows.map(({ file_id, folder_id, at }): Occurrence => ({
      fileId: file_id,
      at,
      label:
        folder_id === null
          ? { place: { kind: "root" }, path: [] }
          : {
              place: { kind: "folder", id: folder_id },
              path: (folderPaths.get(folder_id) ?? []).map((segment) => segment.name),
            },
    })),
    ...eventRows.map((row): Occurrence => ({
      fileId: row.file_id,
      at: row.at,
      label: {
        place: { kind: "event", id: row.id },
        path: ["Events", eventFolderName({ title: row.title, startDate: row.start_date })],
      },
    })),
    ...songRows.map((row): Occurrence => ({
      fileId: row.file_id,
      at: row.at,
      label: { place: { kind: "song", id: row.id }, path: ["Songs", row.title] },
    })),
  ];

  for (const occurrence of occurrences.sort(byOldest)) {
    (byFile[occurrence.fileId] ??= []).push(occurrence.label);
  }
  return byFile;
};

export const listFileOccurrencesQueryFactory: ListFileOccurrencesQueryPortFactory =
  () => (db, scope, input) =>
    selectFileOccurrences(db, scope, input.fileIds);
