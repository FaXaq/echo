import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlaylistSummary } from "../domain/index.js";
import type { SearchPlaylistsQueryPort } from "../infrastructure/search-playlists.query.port.js";

export async function searchPlaylists(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    searchPlaylistsQuery: SearchPlaylistsQueryPort;
  },
  input: { query: string; scope: OrganizationScope },
): Promise<PlaylistSummary[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "read" });

  return deps.searchPlaylistsQuery(deps.db, input.scope, { query: input.query });
}
