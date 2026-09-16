import type { KyselyDB } from "@echo/db";
import { conflict, forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type {
  FindFileByIdQueryPort,
  SetSongFileRoleCommandPort,
} from "@echo/modules/drive/infrastructure";
import type { Role } from "@echo/modules/drive/domain";

export async function setSongAudioVersion(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFileByIdQuery: FindFileByIdQueryPort;
    setSongFileRoleCommand: SetSongFileRoleCommandPort;
  },
  input: {
    songId: string;
    fileId: string;
    role: Role;
    userId: string;
    scope: OrganizationScope;
  },
): Promise<void> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "update" });

  const file = await deps.findFileByIdQuery(deps.db, input.scope, { id: input.fileId });
  if (!file) throw notFound("File");
  if (file.kind !== "audio") throw conflict("Only audio files can be a demo or final version");

  const updated = await deps.setSongFileRoleCommand(deps.db, input.scope, {
    songId: input.songId,
    fileId: input.fileId,
    role: input.role,
    linkedBy: input.userId,
  });
  if (!updated) throw notFound("File");
}
