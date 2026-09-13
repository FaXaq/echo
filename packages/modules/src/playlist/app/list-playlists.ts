import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Playlist } from "../domain/index.js";
import type { ListPlaylistsQueryPort } from "../infrastructure/list-playlists.query.port.js";

export async function listPlaylists(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listPlaylistsQuery: ListPlaylistsQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<Playlist[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "read" });

  return deps.listPlaylistsQuery(deps.db, input.scope);
}
