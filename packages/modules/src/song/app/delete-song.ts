import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import type {
  DeleteFileByIdCommandPort,
  ListFilesBySongQueryPort,
} from "@echo/modules/drive/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { DeleteSongCommandPort } from "../infrastructure/delete-song.command.port.js";

export type DeleteSongFileFailure = { fileId: string; error: unknown };

export async function deleteSong(
  deps: {
    db: KyselyDB;
    deleteSongCommand: DeleteSongCommandPort;
    listFilesBySongQuery: ListFilesBySongQueryPort;
    deleteFileByIdCommand: DeleteFileByIdCommandPort;
    s3Storage: S3StoragePort;
  },
  input: { id: string; scope: OrganizationScope },
): Promise<DeleteSongFileFailure[]> {
  const files = await deps.listFilesBySongQuery(deps.db, input.scope, { songId: input.id });
  const orphanedFiles = files.filter((file) => file.eventId === null);

  const results = await Promise.allSettled(
    orphanedFiles.map((file) => deps.s3Storage.deleteObject(file.s3Key)),
  );
  const failures = results.flatMap((result, index) =>
    result.status === "rejected"
      ? [{ fileId: orphanedFiles[index]!.id, error: result.reason }]
      : [],
  );

  await Promise.all(
    orphanedFiles.map((file) => deps.deleteFileByIdCommand(deps.db, input.scope, { id: file.id })),
  );

  const deleted = await deps.deleteSongCommand(deps.db, input.scope, { id: input.id });
  if (!deleted) throw notFound("Song");

  return failures;
}
