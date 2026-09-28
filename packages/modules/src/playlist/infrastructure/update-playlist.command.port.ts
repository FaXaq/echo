import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Playlist } from "../domain/index.js";

export type UpdatePlaylistInput = {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  intervalSeconds: number | null;
};

export type UpdatePlaylistCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdatePlaylistInput,
) => Promise<Playlist | null>;

export type UpdatePlaylistCommandPortFactory = () => UpdatePlaylistCommandPort;
