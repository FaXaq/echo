import type { DeleteSongCommandPortFactory } from "./delete-song.command.port.js";

export const deleteSongCommandFactory: DeleteSongCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .deleteFrom("song")
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
