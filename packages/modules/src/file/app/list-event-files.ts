import type { KyselyDB } from "@echo/db";
import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import type { FileRecord } from "../domain/index.js";
import { findFileById, listFilesByEvent } from "../infrastructure/index.js";
import type { S3StoragePort } from "@echo/adapters/s3-storage";
import { forbidden, notFound } from "@echo/errors";

export async function listEventFiles(
  deps: {
    db: KyselyDB;
    userHasPermission: CheckUserPermission;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    s3Storage: S3StoragePort;
  },
  input: { eventId: string; userId: string },
): Promise<(FileRecord & { downloadUrl: string })[]> {
  const event = await findFileById(deps.db, input.eventId);
  if (!event) throw notFound("File");

  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: event.organizationId,
    permissions: { file: ["read"] },
  });

  if (!success) {
    if (!success) throw forbidden({ entity: "File", action: "list event files" });
  }

  const files = await listFilesByEvent(deps.db, input.eventId);

  const readable: (FileRecord & { downloadUrl: string })[] = [];
  for (const file of files) {
    const { url } = await deps.s3Storage.createDownloadUrl(file.s3Key);
    readable.push({ ...file, downloadUrl: url });
  }
  return readable;
}
