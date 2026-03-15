import type { KyselyDB } from "@echo/db";
import type { AudioClipRepoPort, AudioClip } from "@echo/app";

export const makeAudioClipRepo = ({
  db,
}: {
  db: KyselyDB;
}): AudioClipRepoPort => ({
  list: async ({ trackId }) => {
    const rows = await db
      .selectFrom("audioClip")
      .selectAll()
      .where("trackId", "=", trackId)
      .execute();
    return rows.map(toAudioClip);
  },

  listBySong: async ({ songId }) => {
    const rows = await db
      .selectFrom("audioClip")
      .innerJoin("track", "track.id", "audioClip.trackId")
      .selectAll("audioClip")
      .where("track.songId", "=", songId)
      .execute();
    return rows.map(toAudioClip);
  },

  create: async ({ id, trackId, filename, storageKey, durationMs, startMeasure }) => {
    const row = await db
      .insertInto("audioClip")
      .values({
        id,
        trackId,
        filename,
        storageKey,
        durationMs: durationMs ?? null,
        startMeasure,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toAudioClip(row);
  },

  updatePosition: async ({ clipId, startMeasure }) => {
    const row = await db
      .updateTable("audioClip")
      .set({ startMeasure })
      .where("id", "=", clipId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toAudioClip(row);
  },

  delete: async ({ clipId }) => {
    await db.deleteFrom("audioClip").where("id", "=", clipId).execute();
  },
});

function toAudioClip(row: {
  id: string;
  trackId: string;
  filename: string;
  storageKey: string;
  durationMs: number | null;
  startMeasure: number;
  createdAt: Date;
}): AudioClip {
  return {
    id: row.id,
    trackId: row.trackId,
    filename: row.filename,
    storageKey: row.storageKey,
    durationMs: row.durationMs,
    startMeasure: row.startMeasure,
    createdAt: row.createdAt,
  };
}
