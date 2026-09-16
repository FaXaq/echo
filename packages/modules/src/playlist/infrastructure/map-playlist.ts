import type { DB } from "@echo/db";
import type { Selectable } from "kysely";
import type { Playlist } from "../domain/index.js";

export type PlaylistRow = Selectable<DB["playlist"]> & {
  created_by_name: string;
  organization_name: string;
  organization_slug: string;
};

export function toPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
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
