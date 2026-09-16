import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Playlist } from "../domain/index.js";
import type { InsertPlaylistCommandPort } from "../infrastructure/insert-playlist.command.port.js";

export async function createPlaylist(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    insertPlaylistCommand: InsertPlaylistCommandPort;
  },
  input: { scope: OrganizationScope; userId: string; title: string; description: string | null },
): Promise<Playlist> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["create"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "create" });

  return deps.insertPlaylistCommand(deps.db, input.scope, {
    id: crypto.randomUUID(),
    userId: input.userId,
    title: input.title,
    description: input.description,
  });
}
