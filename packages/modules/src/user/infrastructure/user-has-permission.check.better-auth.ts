import type { CheckUserPermissionPortFactory } from "./user-has-permission.check.port.js";

export const userHasPermissionCheckFactory: CheckUserPermissionPortFactory =
  (deps) => async (input) => {
    if (!deps.userId) return { success: false, error: null };

    const permissions = input.permissions ?? {};
    if (Object.keys(permissions).length === 0) {
      return { success: true, error: null };
    }

    return deps.auth.api.userHasPermission({
      body: {
        userId: deps.userId,
        permissions,
        role: input.role,
      },
    });
  };
