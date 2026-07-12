import type { SongSectionDefinition } from "../domain/index.js";
import { parseChords } from "../domain/utils.js";
import type { SongSectionDefinitionRepoPort } from "./song-section-definition-repository.port.js";

export const makeSongSectionDefinitionRepo = (): SongSectionDefinitionRepoPort => ({
  create: async (db, { id, songId, name, chords, lyrics, color }) => {
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

  update: async (db, { id, name, chords, lyrics, color }) => {
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

  delete: async (db, { id }) => {
    await db.deleteFrom("songSectionDefinition").where("id", "=", id).execute();
  },

  list: async (db, { songId }) => {
    const rows = await db
      .selectFrom("songSectionDefinition")
      .selectAll()
      .where("songId", "=", songId)
      .orderBy("name", "asc")
      .execute();
    return rows.map(toDefinition);
  },

  get: async (db, { id }) => {
    const row = await db
      .selectFrom("songSectionDefinition")
      .selectAll()
      .where("id", "=", id)
      .executeTakeFirst();
    return row ? toDefinition(row) : null;
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
  repeat: number;
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
    repeat: row.repeat,
  };
}
