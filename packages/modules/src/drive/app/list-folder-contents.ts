import type { KyselyDB } from "@echo/db";
import { forbidden, notFound } from "@echo/errors";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import {
  ROOT_SYSTEM_FOLDERS,
  type DriveLocation,
  type FileRecord,
  type FolderRecord,
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
  folders: FolderRecord[];
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
    systemFolders: input.location.kind === "root" ? ROOT_SYSTEM_FOLDERS : systemFolders,
    files: files.filter((file) => file.status === "uploaded"),
  };
}
