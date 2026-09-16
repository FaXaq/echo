import type { ListSongAudioVersionsQueryPortFactory } from "./list-song-audio-versions.query.port.js";
import { toSongFileRecord } from "./map-file.js";

export const listSongAudioVersionsQueryFactory: ListSongAudioVersionsQueryPortFactory =
  () => async (db, scope, input) => {
    const rows = await db
      .selectFrom("song_file")
      .innerJoin("file", "file.id", "song_file.file_id")
      .innerJoin("user", "file.uploaded_by", "user.id")
      .selectAll("file")
      .select([
        "user.name as uploaded_by_name",
        "song_file.role",
        "song_file.version",
        "song_file.linked_at",
        "song_file.linked_by",
      ])
      .where("song_file.song_id", "=", input.songId)
      .where("file.organization_id", "=", scope.organizationId)
      .where("file.status", "=", "uploaded")
      .where("song_file.role", "is not", null)
      .orderBy("song_file.role")
      .orderBy("song_file.version", "desc")
      .execute();

    return rows.map((row) => toSongFileRecord({ ...row, uploaded_by_name: row.uploaded_by_name }));
  };
