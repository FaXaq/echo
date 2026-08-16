import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { FileRecord } from "../domain/index.js";
import type { ListFilesByOrganizationQueryPort } from "../infrastructure/index.js";

export async function listOrganizationFiles(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listFilesByOrganizationQuery: ListFilesByOrganizationQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<FileRecord[]> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { file: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "read" });

  const files = await deps.listFilesByOrganizationQuery(deps.db, input.scope);
  return files.filter((file) => file.status === "uploaded");
}
