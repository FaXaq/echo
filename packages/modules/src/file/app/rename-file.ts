import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { renameFileById } from "../infrastructure/index.js";
import type { FileRecord } from "../domain/index.js";

export async function renameFile(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
  },
  input: { id: string; scope: OrganizationScope; filename: string },
): Promise<FileRecord> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "update" });

  const updated = await renameFileById(deps.db, input.scope, input.id, input.filename);
  if (!updated) throw notFound("File");
  return updated;
}
