import type { Track } from "../domain/index.js";
import type { TrackRepoPort } from "./track-repository.port.js";

export const makeTrackRepo = (): TrackRepoPort => ({
  list: async (db, { songId }) => {
    const rows = await db
      .selectFrom("track")
      .selectAll()
      .where("songId", "=", songId)
      .orderBy("order", "asc")
      .execute();
    return rows.map(toTrack);
  },

  findById: async (db, { trackId }) => {
    const row = await db
      .selectFrom("track")
      .selectAll()
      .where("id", "=", trackId)
      .executeTakeFirst();
    return row ? toTrack(row) : null;
  },

  create: async (db, { id, songId, name, volume, order }) => {
    const row = await db
      .insertInto("track")
      .values({ id, songId, name, volume, order })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  updateVolume: async (db, { trackId, volumeDb }) => {
    const row = await db
      .updateTable("track")
      .set({ volume: volumeDb, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  setInstrumentPreset: async (db, { trackId, preset }) => {
    const row = await db
      .updateTable("track")
      .set({ instrumentPreset: preset, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  delete: async (db, { trackId }) => {
    await db.deleteFrom("track").where("id", "=", trackId).execute();
  },

  rename: async (db, { trackId, name }) => {
    const row = await db
      .updateTable("track")
      .set({ name, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  reorder: async (db, { orderedTrackIds }) => {
    await db.transaction().execute(async (trx) => {
      for (let i = 0; i < orderedTrackIds.length; i++) {
        await trx
          .updateTable("track")
          .set({ order: i, updatedAt: new Date() })
          .where("id", "=", orderedTrackIds[i])
          .execute();
      }
    });
  },
});

function toTrack(row: {
  id: string;
  songId: string;
  name: string;
  volume: number;
  instrumentPreset: number | null;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}): Track {
  return {
    id: row.id,
    songId: row.songId,
    name: row.name,
    volume: row.volume,
    instrumentPreset: row.instrumentPreset ?? null,
    order: row.order,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}
