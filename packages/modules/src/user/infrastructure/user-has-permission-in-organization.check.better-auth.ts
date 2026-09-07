import { isAPIError } from "@echo/auth";
import type { OrganizationRole } from "@echo/auth";
import type { CheckOrganizationPermissionPortFactory } from "./user-has-permission-in-organization.check.port.js";

export const userHasPermissionInOrganizationCheckFactory: CheckOrganizationPermissionPortFactory =
  (deps) => async (input) => {
    if (!deps.userId || !input.organizationId) {
      return { success: false, error: null, role: null };
    }

    const organizationId = input.organizationId;

    let role: OrganizationRole | null;
    try {
      ({ role } = await deps.auth.api.getActiveMemberRole({
        headers: deps.headers,
        query: { organizationId },
      }));
    } catch (error) {
      if (isAPIError(error) && error.status === "FORBIDDEN") {
        return { success: false, error: null, role: null };
      }
      throw error;
    }

    const permissions = input.permissions ?? {};
    if (Object.keys(permissions).length === 0) {
      return { success: true, error: null, role };
    }

    const { success, error } = await deps.auth.api.hasPermission({
      headers: deps.headers,
      body: { permissions, organizationId },
    });

    return { success, error, role };
  };
