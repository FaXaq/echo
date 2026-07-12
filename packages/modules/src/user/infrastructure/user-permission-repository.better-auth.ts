import type { ServerAuth } from "@echo/auth";
import type { UserPermissionRepoPort } from "./user-permission-repository.port.js";

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

    userHasPermissionInOrganization: async ({ permissions, organizationId }) => {
      if (!userId || !organizationId) return { success: false, error: null, role: null };

      const activeOrganization = await auth.api.getFullOrganization({ headers });

      if (activeOrganization?.id !== organizationId) {
        return { success: false, error: null, role: null };
      }

      const { success, error } = await auth.api.hasPermission({
        headers,
        body: {
          permissions: permissions ?? {},
        },
      });

      const { role } = await auth.api.getActiveMemberRole({ headers });

      return { success, error, role };
    },
  };
};
