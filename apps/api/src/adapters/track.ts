import type { KyselyDB } from "@echo/db";
import type { TrackRepoPort, Track } from "@echo/app";

export const makeTrackRepo = ({ db }: { db: KyselyDB }): TrackRepoPort => ({
  list: async ({ songId }) => {
    const rows = await db
      .selectFrom("track")
      .selectAll()
      .where("songId", "=", songId)
      .orderBy("order", "asc")
      .execute();
    return rows.map(toTrack);
  },

  create: async ({ id, songId, name, volume, order }) => {
    const row = await db
      .insertInto("track")
      .values({ id, songId, name, volume, order })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  updateVolume: async ({ trackId, volume }) => {
    const row = await db
      .updateTable("track")
      .set({ volume, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  delete: async ({ trackId }) => {
    await db.deleteFrom("track").where("id", "=", trackId).execute();
  },
});

function toTrack(row: {
  id: string;
  songId: string;
  name: string;
  volume: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): Track {
  return {
    id: row.id,
    songId: row.songId,
    name: row.name,
    volume: row.volume,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
