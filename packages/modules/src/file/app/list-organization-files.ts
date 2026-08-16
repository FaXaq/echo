import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import { listFilesByOrganization } from "../infrastructure/index.js";

export async function listOrganizationFiles(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
  },
  input: { scope: OrganizationScope },
): Promise<FileRecord[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "read" });

  const files = await listFilesByOrganization(deps.db, input.scope);
  return files.filter((file) => file.status === "uploaded");
}
