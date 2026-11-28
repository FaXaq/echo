import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import {
  type DriveLocation,
  type FileRecord,
  type FolderWithSize,
  type SystemFolderEntry,
} from "../domain/index.js";
import type {
  DriveSortField,
  DriveSortOrder,
  FindFolderByIdQueryPort,
  ListFolderContentsQueryPort,
} from "../infrastructure/index.js";

export async function listFolderContents(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    findFolderByIdQuery: FindFolderByIdQueryPort;
    listFolderContentsQuery: ListFolderContentsQueryPort;
  },
  input: {
    scope: OrganizationScope;
    location: DriveLocation;
    sort: { field: DriveSortField; order: DriveSortOrder };
  },
): Promise<{
  folders: FolderWithSize[];
  systemFolders: SystemFolderEntry[];
  files: FileRecord[];
}> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { drive: ["read"] },
  });
  if (!success) throw forbidden({ entity: "File", action: "read" });

  if (input.location.kind === "folder") {
    const folder = await deps.findFolderByIdQuery(deps.db, input.scope, { id: input.location.id });
    if (!folder) throw notFound("Folder");
  }

  const { folders, systemFolders, files } = await deps.listFolderContentsQuery(
    deps.db,
    input.scope,
    { location: input.location, sort: input.sort },
  );

  return {
    folders,
    systemFolders,
    files: files.filter((file) => file.status === "uploaded"),
  };
}
