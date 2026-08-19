export {
  makeServerAuth,
  type ServerAuthConfig,
  type ServerAuth,
  type ServerSession,
  type ServerOrganization,
} from "./server";

export {
  makeClientAuth,
  type ClientAuthConfig,
  type AuthClient,
  type ClientSession,
  type ClientMember,
  type ClientInvitation,
} from "./client";

export { isAPIError } from "better-auth/api";

export type { SystemRole } from "./plugins/admin/permissions";
export type { OrganizationRole } from "./plugins/organization/permissions";
export { systemRoleSchema, systemRole } from "./plugins/admin/permissions";
export { organizationRoleSchema } from "./plugins/organization/permissions";
