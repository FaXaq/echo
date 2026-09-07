export type {
  PermissionsInput,
  CheckUserPermission,
  CheckUserPermissionPortFactory,
} from "./user-has-permission.check.port.js";
export { userHasPermissionCheckFactory } from "./user-has-permission.check.better-auth.js";

export type {
  OrganizationPermissionsInput,
  UserHasPermissionInOrganizationResult,
  CheckOrganizationPermission,
  CheckOrganizationPermissionPortFactory,
} from "./user-has-permission-in-organization.check.port.js";
export { userHasPermissionInOrganizationCheckFactory } from "./user-has-permission-in-organization.check.better-auth.js";
