import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { selectDefaultSongFile } from "../domain/index.js";
import type { ListSongAudioVersionsQueryPort } from "@echo/modules/drive/infrastructure";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { SongAudioVersion } from "./list-song-audio-versions.js";

export async function getSongDefaultAudio(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    s3Storage: S3StoragePort;
    listSongAudioVersionsQuery: ListSongAudioVersionsQueryPort;
  },
  input: { songId: string; scope: OrganizationScope },
): Promise<SongAudioVersion | null> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "get default song audio" });

  const files = await deps.listSongAudioVersionsQuery(deps.db, input.scope, {
    songId: input.songId,
  });
  const file = selectDefaultSongFile(files);
  if (!file) return null;

  const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
  return { ...file, downloadUrl: url };
}
