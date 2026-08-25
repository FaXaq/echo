import type { DB } from "@echo/db";
import type { Selectable } from "kysely";
import { songTypeSchema, type Song, type SongType } from "../domain/index.js";

export type SongRow = Selectable<DB["song"]> & {
  created_by_name: string;
  organization_name: string;
  organization_slug: string;
};

function toSongType(value: string | null): SongType | null {
  return value === null ? null : songTypeSchema.parse(value);
}

export function toSong(row: SongRow): Song {
  return {
    id: row.id,
    title: row.title,
    artist: row.artist,
    bpm: row.bpm,
    key: row.key,
    lyrics: row.lyrics,
    type: toSongType(row.type),
    organization: {
      id: row.organization_id,
      name: row.organization_name,
      slug: row.organization_slug,
    },
    createdAt: row.created_at,
    createdBy: row.created_by,
    createdByName: row.created_by_name,
    updatedBy: row.updated_by,
    updatedAt: row.updated_at,
  };
}
