import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { SongFileRecord } from "@echo/modules/drive/domain";
import type { ListSongAudioVersionsQueryPort } from "@echo/modules/drive/infrastructure";
import type { S3StoragePort } from "@echo/adapters/s3-storage";

export type SongAudioVersion = SongFileRecord & { downloadUrl: string };

export type SongAudioVersions = {
  demo: SongAudioVersion[];
  final: SongAudioVersion[];
};

export async function listSongAudioVersions(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    s3Storage: S3StoragePort;
    listSongAudioVersionsQuery: ListSongAudioVersionsQueryPort;
  },
  input: { songId: string; scope: OrganizationScope },
): Promise<SongAudioVersions> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "list song audio versions" });

  const links = await deps.listSongAudioVersionsQuery(deps.db, input.scope, {
    songId: input.songId,
  });

  const versions: SongAudioVersions = { demo: [], final: [] };
  for (const link of links) {
    const { url } = await deps.s3Storage.createDownloadUrl(link.s3Key);
    versions[link.role === "demo" ? "demo" : "final"].push({ ...link, downloadUrl: url });
  }
  return versions;
}
