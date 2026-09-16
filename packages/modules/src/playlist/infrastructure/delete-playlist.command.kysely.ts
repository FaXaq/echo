import type { DeletePlaylistCommandPortFactory } from "./delete-playlist.command.port.js";

export const deletePlaylistCommandFactory: DeletePlaylistCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .deleteFrom("playlist")
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
