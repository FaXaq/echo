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

export const makeUserPermissionRepo = ({
  auth,
  userId,
  headers,
}: {
  auth: ServerAuth;
  userId?: string;
  headers: Headers;
}): UserPermissionRepoPort => {
  return {
    userHasPermission: async ({ permissions, role }) => {
      if (!userId) return { success: false, error: null };
      return await auth.api.userHasPermission({
        body: {
          userId,
          permissions: permissions ?? {},
          role,
        },
      });
    },

    userHasPermissionInOrganization: async ({
      permissions,
      organizationId,
    }) => {
      if (!userId || !organizationId)
        return { success: false, error: null, role: null };

      const activeOrganization = await auth.api.getFullOrganization({
        headers,
      });

      if (activeOrganization?.id !== organizationId) {
        return { success: false, error: null, role: null };
      }

      const { success, error } = await auth.api.hasPermission({
        headers,
        body: {
          permissions: permissions ?? {},
        },
      });

      const { role } = await auth.api.getActiveMemberRole({
        headers,
      });

      return { success, error, role };
    },
  };
};
