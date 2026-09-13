import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlaylistSummary } from "../domain/index.js";
import type { ListEventPlaylistsQueryPort } from "../infrastructure/list-event-playlists.query.port.js";

export async function listEventPlaylists(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listEventPlaylistsQuery: ListEventPlaylistsQueryPort;
  },
  input: { eventId: string; scope: OrganizationScope },
): Promise<PlaylistSummary[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "read" });

  return deps.listEventPlaylistsQuery(deps.db, input.scope, { eventId: input.eventId });
}
