import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Playlist } from "../domain/index.js";
import type { UpdatePlaylistCommandPort } from "../infrastructure/update-playlist.command.port.js";

export async function updatePlaylist(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    updatePlaylistCommand: UpdatePlaylistCommandPort;
  },
  input: {
    id: string;
    scope: OrganizationScope;
    userId: string;
    title: string;
    description: string | null;
  },
): Promise<Playlist> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["update"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "update" });

  const updated = await deps.updatePlaylistCommand(deps.db, input.scope, {
    id: input.id,
    userId: input.userId,
    title: input.title,
    description: input.description,
  });
  if (!updated) throw notFound("Playlist");
  return updated;
}
