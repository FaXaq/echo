import type { KyselyDB } from "@echo/db";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { listFilesByOrganization } from "../infrastructure/index.js";

export type DeleteOrganizationFilesFailure = { fileId: string; error: unknown };

export async function deleteOrganizationFiles(
  deps: { db: KyselyDB; s3Storage: S3StoragePort },
  input: { scope: OrganizationScope },
): Promise<DeleteOrganizationFilesFailure[]> {
  const files = await listFilesByOrganization(deps.db, input.scope);

  const results = await Promise.allSettled(
    files.map((file) => deps.s3Storage.deleteObject(file.s3Key)),
  );

  return results.flatMap((result, index) =>
    result.status === "rejected" ? [{ fileId: files[index]!.id, error: result.reason }] : [],
  );
}
