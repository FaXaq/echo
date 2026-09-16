import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { DetachPlaylistFromEventCommandPort } from "../infrastructure/detach-playlist-from-event.command.port.js";

export async function detachPlaylistFromEvent(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    detachPlaylistFromEventCommand: DetachPlaylistFromEventCommandPort;
  },
  input: { playlistId: string; eventId: string; scope: OrganizationScope },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "update" });

  await deps.detachPlaylistFromEventCommand(deps.db, input.scope, {
    playlistId: input.playlistId,
    eventId: input.eventId,
  });
}
