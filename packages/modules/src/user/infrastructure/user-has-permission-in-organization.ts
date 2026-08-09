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

  const activeOrganization = await deps.auth.api.getFullOrganization({ headers: deps.headers });

  if (activeOrganization && activeOrganization.id !== input.organizationId) {
    return { success: false, error: null, role: null };
  }

  const organizationId = input.organizationId ?? activeOrganization?.id;

  const { success, error } = await deps.auth.api.hasPermission({
    headers: deps.headers,
    body: {
      permissions: input.permissions ?? {},
      organizationId,
    },
  });

  const { role } = await deps.auth.api.getActiveMemberRole({
    headers: deps.headers,
    query: { organizationId },
  });

  return { success, error, role };
}
