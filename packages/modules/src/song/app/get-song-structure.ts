import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { songStructureSchema, type SongStructure } from "../domain/index.js";
import { fromMusicXml } from "../domain/musicxml.js";
import type { GetSongScoreQueryPort } from "../infrastructure/get-song-score.query.port.js";

export async function getSongStructure(
  deps: { db: KyselyDB; getSongScoreQuery: GetSongScoreQueryPort },
  input: { scope: OrganizationScope; songId: string },
): Promise<SongStructure> {
  const song = await deps.getSongScoreQuery(deps.db, input.scope, { songId: input.songId });
  if (!song) throw notFound("Song");
  if (song.score === null) return { sections: [] };

  return songStructureSchema.parse(fromMusicXml(song.score));
}
