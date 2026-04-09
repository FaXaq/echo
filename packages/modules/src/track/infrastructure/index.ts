import type { KyselyDB } from "@echo/db";
import type { Track } from "../domain/index.js";

export type { Track };

export interface TrackRepoPort {
  list: (input: { songId: string }) => Promise<Track[]>;
  findById: (input: { trackId: string }) => Promise<Track | null>;
  create: (input: {
    id: string;
    songId: string;
    name: string;
    volume: number;
    order: number;
  }) => Promise<Track>;
  updateVolume: (input: { trackId: string; volumeDb: number }) => Promise<Track>;
  setInstrumentPreset: (input: { trackId: string; preset: number | null }) => Promise<Track>;
  delete: (input: { trackId: string }) => Promise<void>;
  rename: (input: { trackId: string; name: string }) => Promise<Track>;
  reorder: (input: { orderedTrackIds: string[] }) => Promise<void>;
}

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

  findById: async ({ trackId }) => {
    const row = await db
      .selectFrom("track")
      .selectAll()
      .where("id", "=", trackId)
      .executeTakeFirst();
    return row ? toTrack(row) : null;
  },

  create: async ({ id, songId, name, volume, order }) => {
    const row = await db
      .insertInto("track")
      .values({ id, songId, name, volume, order })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  updateVolume: async ({ trackId, volumeDb }) => {
    const row = await db
      .updateTable("track")
      .set({ volume: volumeDb, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  setInstrumentPreset: async ({ trackId, preset }) => {
    const row = await db
      .updateTable("track")
      .set({ instrumentPreset: preset, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  delete: async ({ trackId }) => {
    await db.deleteFrom("track").where("id", "=", trackId).execute();
  },

  rename: async ({ trackId, name }) => {
    const row = await db
      .updateTable("track")
      .set({ name, updatedAt: new Date() })
      .where("id", "=", trackId)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toTrack(row);
  },

  reorder: async ({ orderedTrackIds }) => {
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
