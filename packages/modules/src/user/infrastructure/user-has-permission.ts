import type { ServerAuth, SystemRole } from "@echo/auth";

export type PermissionsInput = NonNullable<
  Parameters<ServerAuth["api"]["userHasPermission"]>[0]
>["body"]["permissions"];

export type CheckUserPermission = (input: {
  permissions: PermissionsInput;
  role?: SystemRole;
}) => ReturnType<ServerAuth["api"]["userHasPermission"]>;

export async function userHasPermission(
  deps: { auth: ServerAuth; userId?: string },
  input: { permissions: PermissionsInput; role?: SystemRole },
): ReturnType<ServerAuth["api"]["userHasPermission"]> {
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
}
