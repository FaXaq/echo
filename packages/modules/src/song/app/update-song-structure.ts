import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { SongStructure } from "../domain/index.js";
import { toMusicXml } from "../domain/musicxml.js";
import type { GetSongScoreQueryPort } from "../infrastructure/get-song-score.query.port.js";
import type { UpdateSongScoreCommandPort } from "../infrastructure/update-song-score.command.port.js";

export async function updateSongStructure(
  deps: {
    db: KyselyDB;
    getSongScoreQuery: GetSongScoreQueryPort;
    updateSongScoreCommand: UpdateSongScoreCommandPort;
  },
  input: { scope: OrganizationScope; id: string; userId: string; structure: SongStructure },
): Promise<SongStructure> {
  const song = await deps.getSongScoreQuery(deps.db, input.scope, { songId: input.id });
  if (!song) throw notFound("Song");

  const updated = await deps.updateSongScoreCommand(deps.db, input.scope, {
    id: input.id,
    userId: input.userId,
    score: toMusicXml(input.structure, { title: song.title }),
  });
  if (!updated) throw notFound("Song");

  return input.structure;
}
