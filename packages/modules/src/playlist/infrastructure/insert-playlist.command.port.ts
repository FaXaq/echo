import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Playlist } from "../domain/index.js";

export type InsertPlaylistInput = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
};

export type InsertPlaylistCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertPlaylistInput,
) => Promise<Playlist>;

export type InsertPlaylistCommandPortFactory = () => InsertPlaylistCommandPort;
