import type { KyselyDB } from "@echo/db";
import type {
  SongSectionDefinition,
  SongSectionInstance,
  SongSectionInstanceWithDefinition,
  SongChord,
} from "../domain/index.js";

export type { SongSectionDefinition, SongSectionInstance, SongSectionInstanceWithDefinition, SongChord };

export interface SongSectionDefinitionRepoPort {
  create: (input: {
    id: string;
    songId: string;
    name: string;
    chords: SongChord[];
    lyrics?: string | null;
    color?: string | null;
  }) => Promise<SongSectionDefinition>;
  update: (input: {
    id: string;
    name?: string;
    chords?: SongChord[];
    lyrics?: string | null;
    color?: string | null;
  }) => Promise<SongSectionDefinition>;
  delete: (input: { id: string }) => Promise<void>;
  list: (input: { songId: string }) => Promise<SongSectionDefinition[]>;
  get: (input: { id: string }) => Promise<SongSectionDefinition | null>;
}

export interface SongSectionInstanceRepoPort {
  create: (input: {
    id: string;
    songId: string;
    definitionId: string;
    startMeasure: number;
    lengthMeasures: number;
    lyricsOverride?: string | null;
  }) => Promise<SongSectionInstance>;
  update: (input: {
    id: string;
    startMeasure?: number;
    lengthMeasures?: number;
    lyricsOverride?: string | null;
  }) => Promise<SongSectionInstance>;
  delete: (input: { id: string }) => Promise<void>;
  list: (input: { songId: string }) => Promise<SongSectionInstanceWithDefinition[]>;
  get: (input: { id: string }) => Promise<SongSectionInstance | null>;
  getLastStartMeasure: (input: { songId: string }) => Promise<{ startMeasure: number; lengthMeasures: number } | null>;
  updateStartMeasures: (input: { updates: Array<{ id: string; startMeasure: number }> }) => Promise<void>;
}

export const makeSongSectionDefinitionRepo = ({ db }: { db: KyselyDB }): SongSectionDefinitionRepoPort => ({
  create: async ({ id, songId, name, chords, lyrics, color }) => {
    const row = await db
      .insertInto("songSectionDefinition")
      .values({
        id,
        songId,
        name,
        chords: JSON.stringify(chords ?? []) as any,
        lyrics: lyrics ?? null,
        color: color ?? null,
      })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toDefinition(row);
  },

  update: async ({ id, name, chords, lyrics, color }) => {
    const row = await db
      .updateTable("songSectionDefinition")
      .set({
        ...(name !== undefined ? { name } : {}),
        ...(chords !== undefined ? { chords: JSON.stringify(chords) as any } : {}),
        ...(lyrics !== undefined ? { lyrics } : {}),
        ...(color !== undefined ? { color } : {}),
        updatedAt: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toDefinition(row);
  },

  delete: async ({ id }) => {
    await db.deleteFrom("songSectionDefinition").where("id", "=", id).execute();
  },

  list: async ({ songId }) => {
    const rows = await db
      .selectFrom("songSectionDefinition")
      .selectAll()
      .where("songId", "=", songId)
      .orderBy("name", "asc")
      .execute();
    return rows.map(toDefinition);
  },

  get: async ({ id }) => {
    const row = await db
      .selectFrom("songSectionDefinition")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toDefinition(row) : null;
  },
});

export const makeSongSectionInstanceRepo = ({ db }: { db: KyselyDB }): SongSectionInstanceRepoPort => ({
  create: async ({ id, songId, definitionId, startMeasure, lengthMeasures, lyricsOverride }) => {
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

  update: async ({ id, startMeasure, lengthMeasures, lyricsOverride }) => {
    const row = await db
      .updateTable("songSectionInstance")
      .set({
        ...(startMeasure !== undefined ? { startMeasure } : {}),
        ...(lengthMeasures !== undefined ? { lengthMeasures } : {}),
        ...(lyricsOverride !== undefined ? { lyricsOverride } : {}),
        updatedAt: new Date(),
      })
      .where("id", "=", id)
      .returningAll()
      .executeTakeFirstOrThrow();
    return toInstance(row);
  },

  delete: async ({ id }) => {
    await db.deleteFrom("songSectionInstance").where("id", "=", id).execute();
  },

  list: async ({ songId }) => {
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
        "d.id as defId",
        "d.songId as defSongId",
        "d.name as defName",
        "d.chords as defChords",
        "d.lyrics as defLyrics",
        "d.color as defColor",
        "d.createdAt as defCreatedAt",
        "d.updatedAt as defUpdatedAt",
      ])
      .where("i.songId", "=", songId)
      .orderBy("i.startMeasure", "asc")
      .execute();

    return rows.map(row => ({
      id: row.id,
      songId: row.songId,
      definitionId: row.definitionId,
      startMeasure: row.startMeasure,
      lengthMeasures: row.lengthMeasures,
      lyricsOverride: row.lyricsOverride,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      definition: {
        id: row.defId,
        songId: row.defSongId,
        name: row.defName,
        chords: parseChords(row.defChords),
        lyrics: row.defLyrics,
        color: row.defColor,
        createdAt: row.defCreatedAt,
        updatedAt: row.defUpdatedAt,
      },
    }));
  },

  get: async ({ id }) => {
    const row = await db
      .selectFrom("songSectionInstance")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toInstance(row) : null;
  },

  getLastStartMeasure: async ({ songId }) => {
    const row = await db
      .selectFrom("songSectionInstance")
      .select(["startMeasure", "lengthMeasures"])
      .where("songId", "=", songId)
      .orderBy("startMeasure", "desc")
      .limit(1)
      .executeTakeFirst();
    return row ? { startMeasure: row.startMeasure, lengthMeasures: row.lengthMeasures } : null;
  },

  updateStartMeasures: async ({ updates }) => {
    for (const { id, startMeasure } of updates) {
      await db
        .updateTable("songSectionInstance")
        .set({ startMeasure, updatedAt: new Date() })
        .where("id", "=", id)
        .execute();
    }
  },
});

function toDefinition(row: {
  id: string;
  songId: string;
  name: string;
  chords: unknown;
  lyrics: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SongSectionDefinition {
  return {
    id: row.id,
    songId: row.songId,
    name: row.name,
    chords: parseChords(row.chords),
    lyrics: row.lyrics,
    color: row.color,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toInstance(row: {
  id: string;
  songId: string;
  definitionId: string;
  startMeasure: number;
  lengthMeasures: number;
  lyricsOverride: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  };
}

function parseChords(raw: unknown): SongChord[] {
  if (!raw) return [];
  if (typeof raw === "string") {
    try { return JSON.parse(raw); } catch { return []; }
  }
  if (Array.isArray(raw)) return raw as SongChord[];
  return [];
}
