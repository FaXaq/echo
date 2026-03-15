import type { OrganizationOptions, Role } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import {
  defaultStatements,
  adminAc,
  ownerAc,
} from "better-auth/plugins/organization/access";
import z from "zod";

export const statement = {
  ...defaultStatements,
  "*": ["read"],
} as const;

export const ac = createAccessControl(statement);

const member = ac.newRole({
  "*": ["read"],
});

// Default Better-Auth role
const owner = ac.newRole({
  ...ownerAc.statements,
});

// Default Better-Auth role
const admin = ac.newRole({
  ...adminAc.statements,
});

// Define roles
export const organizationRoleSchema = z.enum(["member", "owner", "admin"]);
export type OrganizationRole = z.infer<typeof organizationRoleSchema>;
export const organizationRole = organizationRoleSchema.enum;

export const roles: Record<OrganizationRole, Role> = {
  member,
  owner,
  admin,
} as const;

export const organizationPluginConfig = {
  ac,
  roles,
} satisfies OrganizationOptions;
