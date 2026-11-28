import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import type { DeleteOrphanedFilesCommandPort } from "@echo/modules/drive/infrastructure";
import { purgeOrphanedFiles } from "@echo/modules/drive/app";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { DeleteSongCommandPort } from "../infrastructure/delete-song.command.port.js";

export type DeleteSongFileFailure = { fileId: string; error: unknown };

export async function deleteSong(
  deps: {
    db: KyselyDB;
    deleteSongCommand: DeleteSongCommandPort;
    deleteOrphanedFilesCommand: DeleteOrphanedFilesCommandPort;
    s3Storage: S3StoragePort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<DeleteSongFileFailure[]> {
  const deleted = await deps.deleteSongCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("Song");

  const { failures } = await purgeOrphanedFiles(deps, {
    scope: input.scope,
    fileIds: deleted.fileIds,
  });
  return failures;
}
