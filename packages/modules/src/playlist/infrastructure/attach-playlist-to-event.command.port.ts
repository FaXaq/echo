import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type AttachPlaylistToEventInput = { playlistId: string; eventId: string };

export type AttachPlaylistToEventCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: AttachPlaylistToEventInput,
) => Promise<void>;

export type AttachPlaylistToEventCommandPortFactory = () => AttachPlaylistToEventCommandPort;
