import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { AttachPlaylistToEventCommandPort } from "../infrastructure/attach-playlist-to-event.command.port.js";

export async function attachPlaylistToEvent(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    attachPlaylistToEventCommand: AttachPlaylistToEventCommandPort;
  },
  input: { playlistId: string; eventId: string; scope: OrganizationScope },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "update" });

  await deps.attachPlaylistToEventCommand(deps.db, input.scope, {
    playlistId: input.playlistId,
    eventId: input.eventId,
  });
}
