import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DetachPlaylistFromEventInput = { playlistId: string; eventId: string };

export type DetachPlaylistFromEventCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DetachPlaylistFromEventInput,
) => Promise<void>;

export type DetachPlaylistFromEventCommandPortFactory = () => DetachPlaylistFromEventCommandPort;
