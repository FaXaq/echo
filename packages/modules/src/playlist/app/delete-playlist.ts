import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { DeletePlaylistCommandPort } from "../infrastructure/delete-playlist.command.port.js";

export async function deletePlaylist(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    deletePlaylistCommand: DeletePlaylistCommandPort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["delete"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "delete" });

  const deleted = await deps.deletePlaylistCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("Playlist");
}
