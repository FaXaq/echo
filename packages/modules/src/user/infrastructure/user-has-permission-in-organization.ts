import { isAPIError } from "@echo/auth";
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

export async function userHasPermissionInOrganization(
  deps: { auth: ServerAuth; userId?: string; headers: Headers },
  input: { organizationId?: string | null; permissions: OrganizationPermissionsInput },
): Promise<UserHasPermissionInOrganizationResult> {
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
}
