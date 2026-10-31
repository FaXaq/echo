import type { KyselyDB } from "@echo/db";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { fileObjectKeys } from "../domain/index.js";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { ListFilesByOrganizationQueryPort } from "../infrastructure/index.js";

export type DeleteOrganizationFilesFailure = { fileId: string; error: unknown };

export async function deleteOrganizationFiles(
  deps: {
    db: KyselyDB;
    s3Storage: S3StoragePort;
    listFilesByOrganizationQuery: ListFilesByOrganizationQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<DeleteOrganizationFilesFailure[]> {
  const files = await deps.listFilesByOrganizationQuery(deps.db, input.scope);

  const results = await Promise.allSettled(
    files.map((file) =>
      Promise.all(fileObjectKeys(file).map((key) => deps.s3Storage.deleteObject(key))),
    ),
  );

  return results.flatMap((result, index) =>
    result.status === "rejected" ? [{ fileId: files[index]!.id, error: result.reason }] : [],
  );
}
