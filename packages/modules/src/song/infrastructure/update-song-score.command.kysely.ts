import type { UpdateSongScoreCommandPortFactory } from "./update-song-score.command.port.js";

export const updateSongScoreCommandFactory: UpdateSongScoreCommandPortFactory =
  () => async (db, scope, input) => {
    const updated = await db
      .updateTable("song")
      .set({ score: input.score, updated_by: input.userId, updated_at: new Date() })
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .returning("id")
      .executeTakeFirst();

    return updated !== undefined;
  };
