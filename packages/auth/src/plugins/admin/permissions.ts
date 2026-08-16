import type { AdminOptions, Role } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc } from "better-auth/plugins/admin/access";
import { z } from "zod";

export const statement = {
  self: ["read"],
  organization: ["read", "create", "update", "delete"],
  ...defaultStatements,
} as const;

export const ac = createAccessControl(statement);

// Default Better-Auth role
const client = ac.newRole({
  self: ["read"],
});

// Default Better-Auth role
const admin = ac.newRole({
  organization: ["read", "create", "update", "delete"],
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
