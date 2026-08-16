import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type {
  CheckOrganizationPermission,
  CheckUserPermission,
} from "@echo/modules/user/infrastructure";
import { findFileById, renameFileById } from "../infrastructure/index.js";
import type { FileRecord } from "../domain/index.js";

export async function renameFile(
  deps: {
    db: KyselyDB;
    userHasPermission: CheckUserPermission;
    userHasPermissionInOrganization: CheckOrganizationPermission;
  },
  input: { id: string; userId: string; filename: string },
): Promise<FileRecord> {
  const file = await findFileById(deps.db, input.id);
  if (!file) throw notFound("File");

  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: file.organizationId,
    permissions: { file: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "update" });

  const updated = await renameFileById(deps.db, input.id, input.filename);
  if (!updated) throw notFound("File");
  return updated;
}
