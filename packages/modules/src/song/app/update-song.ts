import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song, SongType } from "../domain/index.js";
import type { UpdateSongCommandPort } from "../infrastructure/update-song.command.port.js";

export async function updateSong(
  deps: { db: KyselyDB; updateSongCommand: UpdateSongCommandPort },
  input: {
    id: string;
    scope: OrganizationScope;
    userId: string;
    title: string;
    artist?: string | null;
    bpm?: number | null;
    key?: string | null;
    type?: SongType | null;
  },
): Promise<Song> {
  const updated = await deps.updateSongCommand(deps.db, input.scope, {
    id: input.id,
    userId: input.userId,
    title: input.title,
    artist: input.artist ?? null,
    bpm: input.bpm ?? null,
    key: input.key ?? null,
    type: input.type ?? null,
  });

  if (!updated) throw notFound("Song");
  return updated;
}
