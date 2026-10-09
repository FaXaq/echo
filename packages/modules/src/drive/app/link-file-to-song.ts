import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type {
  FindFileByIdQueryPort,
  LinkFileToSongCommandPort,
  SongExistsInOrganizationQueryPort,
} from "../infrastructure/index.js";

export async function linkFileToSong(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFileByIdQuery: FindFileByIdQueryPort;
    songExistsInOrganizationQuery: SongExistsInOrganizationQueryPort;
    linkFileToSongCommand: LinkFileToSongCommandPort;
  },
  input: { fileId: string; songId: string; userId: string; scope: OrganizationScope },
) {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "link to song" });

  const file = await deps.findFileByIdQuery(deps.db, input.scope, { id: input.fileId });
  if (!file) throw notFound("File");

  const songExists = await deps.songExistsInOrganizationQuery(deps.db, input.scope, {
    songId: input.songId,
  });
  if (!songExists) throw notFound("Song");

  await deps.linkFileToSongCommand(deps.db, input.scope, {
    songId: input.songId,
    fileId: input.fileId,
    linkedBy: input.userId,
  });
}
