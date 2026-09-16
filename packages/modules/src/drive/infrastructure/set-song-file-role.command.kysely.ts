import type { SetSongFileRoleCommandPortFactory } from "./set-song-file-role.command.port.js";
import { songAndFileBelongToOrganization } from "./common.js";

export const setSongFileRoleCommandFactory: SetSongFileRoleCommandPortFactory =
  () => async (db, scope, input) => {
    return db.transaction().execute(async (trx) => {
      const result = await trx
        .updateTable("song_file")
        .set((eb) => ({
          role: input.role,
          version: eb
            .case()
            .when("role", "=", input.role)
            .then(eb.ref("version"))
            .else(
              eb(
                eb
                  .selectFrom("song_file as existing")
                  .select((eb2) =>
                    eb2.fn.coalesce(eb2.fn.max("existing.version"), eb2.lit(0)).as("value"),
                  )
                  .where("existing.song_id", "=", input.songId)
                  .where("existing.role", "=", input.role),
                "+",
                1,
              ),
            )
            .end(),
          linked_at: eb
            .case()
            .when("role", "=", input.role)
            .then(eb.ref("linked_at"))
            .else(new Date())
            .end(),
          linked_by: eb
            .case()
            .when("role", "=", input.role)
            .then(eb.ref("linked_by"))
            .else(input.linkedBy)
            .end(),
        }))
        .where("song_id", "=", input.songId)
        .where("file_id", "=", input.fileId)
        .where((eb) => songAndFileBelongToOrganization(eb, trx, scope, input.songId, input.fileId))
        .executeTakeFirst();

      return (result.numUpdatedRows ?? 0n) > 0n;
    });
  };
