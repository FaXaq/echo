import type { DeleteSongCommandPortFactory } from "./delete-song.command.port.js";

export const deleteSongCommandFactory: DeleteSongCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const links = await trx
        .selectFrom("song_file")
        .select("file_id")
        .where("song_id", "=", input.id)
        .execute();

      const result = await trx
        .deleteFrom("song")
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .executeTakeFirst();

      if (result.numDeletedRows === 0n) return null;
      return { fileIds: links.map((link) => link.file_id) };
    });
  };
