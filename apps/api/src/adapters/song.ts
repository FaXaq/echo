import type { KyselyDB } from "@echo/db";
import type { SongRepoPort, Song } from "@echo/app";

export const makeSongRepo = ({ db }: { db: KyselyDB }): SongRepoPort => ({
  list: async ({ organizationId }) => {
    const rows = await db
      .selectFrom("song")
      .selectAll()
      .where("organizationId", "=", organizationId)
      .execute();
    return rows.map(toSong);
  },

  create: async ({ id, name, organizationId, createdBy, key }) => {
    const row = await db
      .insertInto("song")
      .values({ id, name, organizationId, createdBy, key: key ?? null })
      .returningAll()
      .executeTakeFirstOrThrow();
    return toSong(row);
  },

  get: async ({ songId }) => {
    const row = await db
      .selectFrom("song")
      .selectAll()
      .where("id", "=", songId)
      .executeTakeFirst();
    return row ? toSong(row) : null;
  },
});

function toSong(row: {
  id: string;
  name: string;
  organizationId: string;
  bpm: number | null;
  description: string | null;
  key: string | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  updatedBy: string | null;
}): Song {
  return {
    id: row.id,
    name: row.name,
    organizationId: row.organizationId,
    bpm: row.bpm,
    description: row.description,
    key: row.key,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    updatedBy: row.updatedBy,
  };
}
