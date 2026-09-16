import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Playlist } from "../domain/index.js";
import type { GetPlaylistByIdQueryPort } from "../infrastructure/get-playlist-by-id.query.port.js";

export async function getPlaylistById(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    getPlaylistByIdQuery: GetPlaylistByIdQueryPort;
  },
  input: { playlistId: string; scope: OrganizationScope },
): Promise<Playlist> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { playlist: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Playlist", action: "read" });

  const playlist = await deps.getPlaylistByIdQuery(deps.db, input.scope, {
    playlistId: input.playlistId,
  });
  if (playlist === undefined) throw notFound("Playlist");
  return playlist;
}
