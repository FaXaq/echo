import { makeDbAdapter, type KyselyDB } from "@echo/db";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { Contact } from "../domain/index.js";

export function makeFakeDb(): KyselyDB {
  return makeDbAdapter({
    host: "localhost",
    port: 5432,
    user: "test",
    password: "test",
    name: "test",
  }).db;
}

export function makeFakePermissionChecks(
  overrides: Partial<{ userHasPermissionInOrganization: CheckOrganizationPermission }> = {},
): { userHasPermissionInOrganization: CheckOrganizationPermission } {
  return {
    userHasPermissionInOrganization: async () => ({ success: true, error: null, role: null }),
    ...overrides,
  };
}

export function makeFakeContact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: "contact-1",
    organizationId: "org-1",
    name: "Jamie Booker",
    phone: null,
    email: null,
    description: null,
    ...overrides,
  };
}
