import type { OrganizationRole, ServerAuth } from "@echo/auth";

export type OrganizationPermissionsInput = NonNullable<
  Parameters<ServerAuth["api"]["hasPermission"]>[0]
>["body"]["permissions"];

export type UserHasPermissionInOrganizationResult = Awaited<
  ReturnType<ServerAuth["api"]["userHasPermission"]>
> & {
  role: OrganizationRole | null;
};

export type CheckOrganizationPermission = (input: {
  organizationId?: string | null;
  permissions: OrganizationPermissionsInput;
}) => Promise<UserHasPermissionInOrganizationResult>;

export type CheckOrganizationPermissionPortFactory = (deps: {
  auth: ServerAuth;
  userId?: string;
  headers: Headers;
}) => CheckOrganizationPermission;
