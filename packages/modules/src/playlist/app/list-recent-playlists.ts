import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { ListRecentPlaylistsQueryPort } from "../infrastructure/list-recent-playlists.query.port.js";

export async function listRecentPlaylists(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listRecentPlaylistsQuery: ListRecentPlaylistsQueryPort;
  },
  input: { scope: OrganizationScope; limit: number },
) {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "read" });

  return deps.listRecentPlaylistsQuery(deps.db, input.scope, { limit: input.limit });
}
