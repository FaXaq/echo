import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Song, SongType } from "../domain/index.js";
import type { InsertSongCommandPort } from "../infrastructure/insert-song.command.port.js";

export async function createSong(
  deps: { db: KyselyDB; insertSongCommand: InsertSongCommandPort },
  input: {
    scope: OrganizationScope;
    userId: string;
    title: string;
    artist?: string | null;
    bpm?: number | null;
    key?: string | null;
    type?: SongType | null;
  },
): Promise<Song> {
  return deps.insertSongCommand(deps.db, input.scope, {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title,
    artist: input.artist ?? null,
    bpm: input.bpm ?? null,
    key: input.key ?? null,
    type: input.type ?? null,
  });
}
