import auth from "./auth";
import type { UserPermissionRepoPort } from "@echo/app/ports";

export const makeUserPermissionRepo = ({
  userId,
  headers,
}: {
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

      // is not active organization
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
