import type { AdminOptions, Role } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
import { z } from "zod";

const fileActions = ["selfCreate", "selfRead", "selfDelete", "create", "read", "delete"] as const;

export const statement = {
  // we need to have this small element to create empty roles for bootstrapping RBAC
  "*": ["read"],
  organization: ["read", "create", "update", "delete"],
  file: [...fileActions],
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

// Default Better-Auth role
const client = ac.newRole({
  "*": ["read"],
  file: ["selfCreate", "selfRead", "selfDelete"],
});

// Default Better-Auth role
const admin = ac.newRole({
  organization: ["read", "create", "update", "delete"],
  file: [...fileActions],
  ...adminAc.statements,
});

// Define roles
export const systemRoleSchema = z.enum(["admin", "client"]);
export type SystemRole = z.infer<typeof systemRoleSchema>;
export const systemRole = systemRoleSchema.enum;

export const roles: Record<SystemRole, Role> = {
  client,
  admin,
} as const;

export const adminPluginConfig = {
  ac,
  roles,
} satisfies AdminOptions;
