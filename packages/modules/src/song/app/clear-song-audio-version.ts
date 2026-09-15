import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { ClearSongFileRoleCommandPort } from "@echo/modules/drive/infrastructure";

export async function clearSongAudioVersion(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    clearSongFileRoleCommand: ClearSongFileRoleCommandPort;
  },
  input: { songId: string; fileId: string; scope: OrganizationScope },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "update" });

  const cleared = await deps.clearSongFileRoleCommand(deps.db, input.scope, {
    songId: input.songId,
    fileId: input.fileId,
  });
  if (!cleared) throw notFound("File");
}
