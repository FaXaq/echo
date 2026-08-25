import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song } from "../domain/index.js";
import type { GetSongByIdQueryPort } from "../infrastructure/get-song-by-id.query.port.js";

export async function getSongById(
  deps: { db: KyselyDB; getSongByIdQuery: GetSongByIdQueryPort },
  input: { songId: string; scope: OrganizationScope },
): Promise<Song> {
  const song = await deps.getSongByIdQuery(deps.db, input.scope, { songId: input.songId });
  if (song === undefined) throw notFound("Song");
  return song;
}
