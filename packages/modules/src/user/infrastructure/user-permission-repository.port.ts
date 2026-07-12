import type { OrganizationRole, ServerAuth, SystemRole } from "@echo/auth";

type UserHasPermissionBody = NonNullable<
  Parameters<ServerAuth["api"]["userHasPermission"]>[0]
>["body"];
type UserHasPermissionInOrganization = NonNullable<
  Parameters<ServerAuth["api"]["hasPermission"]>[0]
>["body"];

export interface UserPermissionRepoPort {
  userHasPermission: (input: {
    permissions: UserHasPermissionBody["permissions"];
    role?: SystemRole;
  }) => ReturnType<ServerAuth["api"]["userHasPermission"]>;

  userHasPermissionInOrganization: (input: {
    organizationId?: string | null;
    permissions: UserHasPermissionInOrganization["permissions"];
  }) => Promise<
    Awaited<ReturnType<ServerAuth["api"]["userHasPermission"]>> & {
      role: OrganizationRole | null;
    }
  >;
}
