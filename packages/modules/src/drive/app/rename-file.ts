import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { RenameFileByIdCommandPort } from "../infrastructure/index.js";
import type { FileRecord } from "../domain/index.js";

export async function renameFile(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    renameFileByIdCommand: RenameFileByIdCommandPort;
  },
  input: { id: string; scope: OrganizationScope; filename: string },
): Promise<FileRecord> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["update"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "update" });

  const updated = await deps.renameFileByIdCommand(deps.db, input.scope, {
    id: input.id,
    filename: input.filename,
  });
  if (!updated) throw notFound("File");
  return updated;
}
