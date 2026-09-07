import type { ServerAuth, SystemRole } from "@echo/auth";

export type PermissionsInput = NonNullable<
  Parameters<ServerAuth["api"]["userHasPermission"]>[0]
>["body"]["permissions"];

export type CheckUserPermission = (input: {
  permissions: PermissionsInput;
  role?: SystemRole;
}) => ReturnType<ServerAuth["api"]["userHasPermission"]>;

export type CheckUserPermissionPortFactory = (deps: {
  auth: ServerAuth;
  userId?: string;
}) => CheckUserPermission;
