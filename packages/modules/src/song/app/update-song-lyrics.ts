import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song } from "../domain/index.js";
import type { UpdateSongLyricsCommandPort } from "../infrastructure/update-song-lyrics.command.port.js";

export async function updateSongLyrics(
  deps: { db: KyselyDB; updateSongLyricsCommand: UpdateSongLyricsCommandPort },
  input: { id: string; scope: OrganizationScope; userId: string; lyrics: string | null },
): Promise<Song> {
  const updated = await deps.updateSongLyricsCommand(deps.db, input.scope, {
    id: input.id,
    userId: input.userId,
    lyrics: input.lyrics,
  });

  if (!updated) throw notFound("Song");
  return updated;
}
