import type { OrganizationOptions, Role } from "better-auth/plugins";
import { createAccessControl } from "better-auth/plugins/access";
import { defaultStatements, adminAc, ownerAc } from "better-auth/plugins/organization/access";
import z from "zod";

const calendarEventActions = ["create", "read", "update", "delete"] as const;
const driveActions = ["create", "read", "delete", "update"] as const;
const planActions = ["create", "read", "delete", "update"] as const;
const quotaActions = ["create", "read", "delete", "update"] as const;

export const statement = {
  ...defaultStatements,
  calendarEvent: [...calendarEventActions],
  drive: [...driveActions],
  plan: [...planActions],
  quota: [...quotaActions],
} as const;

export const ac = createAccessControl(statement);

const member = ac.newRole({
  calendarEvent: [...calendarEventActions],
  drive: [...driveActions],
  quota: [...quotaActions],
});

// Default Better-Auth role
const owner = ac.newRole({
  ...ownerAc.statements,
  calendarEvent: [...calendarEventActions],
  drive: [...driveActions],
  plan: [...planActions],
  quota: [...quotaActions],
});

// Default Better-Auth role
const admin = ac.newRole({
  ...adminAc.statements,
  calendarEvent: [...calendarEventActions],
  drive: [...driveActions],
  plan: [...planActions],
  quota: [...quotaActions],
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
