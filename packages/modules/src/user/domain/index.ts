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

export const canUpdateOrgMemberRole = (viewerRole: OrganizationRole | null | undefined): boolean =>
  viewerRole === "owner" || viewerRole === "admin";

export const canRevokeMembership = (
  viewerRole: OrganizationRole | null | undefined,
  targetRole: OrganizationRole,
): boolean => {
  if (viewerRole === "owner") return true;
  if (viewerRole === "admin") return targetRole === "member";
  return false;
};

export const canCancelInvitation = (viewerRole: OrganizationRole | null | undefined): boolean =>
  viewerRole === "owner" || viewerRole === "admin";
