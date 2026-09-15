import type { LinkFileToSongCommandPortFactory } from "./link-file-to-song.command.port.js";

export const linkFileToSongCommandFactory: LinkFileToSongCommandPortFactory =
  () => async (db, scope, input) => {
    await db
      .insertInto("song_file")
      .columns(["song_id", "file_id", "linked_by"])
      .expression((eb) =>
        eb
          .selectFrom(["song", "file"])
          .select([
            eb.val(input.songId).as("song_id"),
            eb.val(input.fileId).as("file_id"),
            eb.val(input.linkedBy).as("linked_by"),
          ])
          .where("song.id", "=", input.songId)
          .where("song.organization_id", "=", scope.organizationId)
          .where("file.id", "=", input.fileId)
          .where("file.organization_id", "=", scope.organizationId),
      )
      .execute();
  };
