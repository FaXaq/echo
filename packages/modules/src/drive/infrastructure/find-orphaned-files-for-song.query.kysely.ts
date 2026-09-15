import type { FindOrphanedFilesForSongQueryPortFactory } from "./find-orphaned-files-for-song.query.port.js";
import { toFileRecord } from "./map-file.js";

export const findOrphanedFilesForSongQueryFactory: FindOrphanedFilesForSongQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("file")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .innerJoin("song_file", "song_file.file_id", "file.id")
      .selectAll("file")
      .select("user.name as uploaded_by_name")
      .where("song_file.song_id", "=", input.songId)
      .where("file.organization_id", "=", scope.organizationId)
      .where("file.event_id", "is", null)
      .where(({ not, exists, selectFrom }) =>
        not(
          exists(
            selectFrom("song_file as other_song_file")
              .select("other_song_file.song_id")
              .whereRef("other_song_file.file_id", "=", "file.id")
              .where("other_song_file.song_id", "!=", input.songId),
          ),
        ),
      )
      .execute();

    return rows.map((row) => toFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
  };
