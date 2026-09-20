import { makeDbAdapter, type KyselyDB } from "@echo/db";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { OutreachCard, OutreachColumn } from "../domain/index.js";

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

export function makeFakeOutreachColumn(overrides: Partial<OutreachColumn> = {}): OutreachColumn {
  return {
    id: "column-1",
    organizationId: "org-1",
    name: "À contacter",
    position: 0,
    ...overrides,
  };
}

export function makeFakeOutreachCard(overrides: Partial<OutreachCard> = {}): OutreachCard {
  return {
    id: "card-1",
    organizationId: "org-1",
    columnId: "column-1",
    title: "Book a residency",
    position: 0,
    place: null,
    description: null,
    assigneeId: null,
    assigneeName: null,
    createdAt: new Date("2026-01-01"),
    createdBy: "user-1",
    updatedBy: null,
    updatedAt: null,
    ...overrides,
  };
}
