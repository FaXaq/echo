import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { FileRecord } from "../domain/index.js";
import { listFilesByOrganization } from "../infrastructure/index.js";

export async function listOrganizationFiles(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
  },
  input: { organizationId: string },
): Promise<FileRecord[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.organizationId,
    permissions: { file: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "read" });

  const files = await listFilesByOrganization(deps.db, input.organizationId);
  return files.filter((file) => file.status === "uploaded");
}
