import type { SongSectionInstance } from "../domain/index.js";
import { parseChords } from "../domain/utils.js";
import type { SongSectionInstanceRepoPort } from "./song-section-instance-repository.port.js";

export const makeSongSectionInstanceRepo = (): SongSectionInstanceRepoPort => ({
  create: async (db, { id, songId, definitionId, startMeasure, lengthMeasures, lyricsOverride }) => {
    const row = await db
      .insertInto("songSectionInstance")
      .values({
        id,
        songId,
        definitionId,
        startMeasure,
        lengthMeasures,
        lyricsOverride: lyricsOverride ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toInstance(row);
  },

  update: async (db, { id, startMeasure, lengthMeasures, lyricsOverride, repeat }) => {
    const row = await db
      .updateTable("songSectionInstance")
      .set({
        ...(startMeasure !== undefined ? { startMeasure } : {}),
        ...(lengthMeasures !== undefined ? { lengthMeasures } : {}),
        ...(lyricsOverride !== undefined ? { lyricsOverride } : {}),
        ...(repeat !== undefined ? { repeat } : {}),
        updatedAt: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toInstance(row);
  },

  delete: async (db, { id }) => {
    await db.deleteFrom("songSectionInstance").where("id", "=", id).execute();
  },

  list: async (db, { songId }) => {
    const rows = await db
      .selectFrom("songSectionInstance as i")
      .innerJoin("songSectionDefinition as d", "d.id", "i.definitionId")
      .select([
        "i.id",
        "i.songId",
        "i.definitionId",
        "i.startMeasure",
        "i.lengthMeasures",
        "i.lyricsOverride",
        "i.createdAt",
        "i.updatedAt",
        "i.repeat",
        "d.id as defId",
        "d.songId as defSongId",
        "d.name as defName",
        "d.chords as defChords",
        "d.lyrics as defLyrics",
        "d.color as defColor",
        "d.createdAt as defCreatedAt",
        "d.updatedAt as defUpdatedAt",
        "d.repeat as defRepeat",
      ])
      .where("i.songId", "=", songId)
      .orderBy("i.startMeasure", "asc")
      .execute();

    return rows.map((row) => ({
      id: row.id,
      songId: row.songId,
      definitionId: row.definitionId,
      startMeasure: row.startMeasure,
      lengthMeasures: row.lengthMeasures,
      lyricsOverride: row.lyricsOverride,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      repeat: row.repeat,
      definition: {
        id: row.defId,
        songId: row.defSongId,
        name: row.defName,
        chords: parseChords(row.defChords),
        lyrics: row.defLyrics,
        color: row.defColor,
        createdAt: row.defCreatedAt,
        updatedAt: row.defUpdatedAt,
        repeat: row.defRepeat,
      },
    }));
  },

  get: async (db, { id }) => {
    const row = await db
      .selectFrom("songSectionInstance")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toInstance(row) : null;
  },

  getLastStartMeasure: async (db, { songId }) => {
    const row = await db
      .selectFrom("songSectionInstance")
      .select(["startMeasure", "lengthMeasures"])
      .where("songId", "=", songId)
      .orderBy("startMeasure", "desc")
      .limit(1)
      .executeTakeFirst();
    return row ? { startMeasure: row.startMeasure, lengthMeasures: row.lengthMeasures } : null;
  },

  updateStartMeasures: async (db, { updates }) => {
    for (const { id, startMeasure } of updates) {
      await db
        .updateTable("songSectionInstance")
        .set({ startMeasure, updatedAt: new Date() })
        .where("id", "=", id)
        .execute();
    }
  },
});

function toInstance(row: {
  id: string;
  songId: string;
  definitionId: string;
  startMeasure: number;
  lengthMeasures: number;
  lyricsOverride: string | null;
  createdAt: Date;
  updatedAt: Date;
  repeat: number;
}): SongSectionInstance {
  return {
    id: row.id,
    songId: row.songId,
    definitionId: row.definitionId,
    startMeasure: row.startMeasure,
    lengthMeasures: row.lengthMeasures,
    lyricsOverride: row.lyricsOverride,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    repeat: row.repeat,
  };
}
