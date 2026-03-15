import type { ClientSession } from "@echo/auth/client";
import type { ServerSession } from "@echo/auth/server";
import type { OrganizationRole } from "@echo/auth";
import { systemRoleSchema } from "@echo/auth";

const ADMIN_ROLE = systemRoleSchema.enum.admin;

export const isSystemAdmin = (
  session: ClientSession | ServerSession | null | undefined,
): boolean => {
  if (session === null || session === undefined) return false;

  const parsed = systemRoleSchema.safeParse(session.user.role);
  return parsed.success && parsed.data === ADMIN_ROLE;
};

// Can this role edit any member's role (show Select vs Badge)?
export const canUpdateOrgMemberRole = (
  viewerRole: OrganizationRole | null | undefined,
): boolean => viewerRole === "owner" || viewerRole === "admin";

// Can this viewer revoke a specific member's membership?
// owner → any; admin → member only; member → nobody
export const canRevokeMembership = (
  viewerRole: OrganizationRole | null | undefined,
  targetRole: OrganizationRole,
): boolean => {
  if (viewerRole === "owner") return true;
  if (viewerRole === "admin") return targetRole === "member";
  return false;
};

// Can this role cancel a pending invitation?
export const canCancelInvitation = (
  viewerRole: OrganizationRole | null | undefined,
): boolean => viewerRole === "owner" || viewerRole === "admin";
