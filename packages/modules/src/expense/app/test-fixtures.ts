import { makeDbAdapter, type KyselyDB } from "@echo/db";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import type { CalendarEvent } from "@echo/modules/calendar/domain";
import type { Expense, Repayment } from "../domain/index.js";

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

export const deniedPermissionChecks = makeFakePermissionChecks({
  userHasPermissionInOrganization: async () => ({ success: false, error: null, role: null }),
});

export function makeFakeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: "expense-1",
    organizationId: "org-1",
    title: "Rehearsal room",
    description: null,
    paidOn: "2026-10-01",
    amountMinor: 4000,
    currency: "EUR",
    exchangeRate: null,
    convertedAmountMinor: 4000,
    splitMode: "equal",
    payerId: "marie",
    eventId: null,
    createdBy: "marie",
    createdAt: new Date("2026-10-01T10:00:00Z"),
    updatedAt: null,
    shares: [
      { userId: "marie", amountMinor: 2000, convertedAmountMinor: 2000 },
      { userId: "paul", amountMinor: 2000, convertedAmountMinor: 2000 },
    ],
    ...overrides,
  };
}

export function makeFakeRepayment(overrides: Partial<Repayment> = {}): Repayment {
  return {
    id: "repayment-1",
    organizationId: "org-1",
    fromUserId: "paul",
    toUserId: "marie",
    amountMinor: 2000,
    paidOn: "2026-10-02",
    note: null,
    createdBy: "paul",
    createdAt: new Date("2026-10-02T10:00:00Z"),
    ...overrides,
  };
}

export function makeFakeCalendarEvent(overrides: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "event-1",
    title: "Gig",
    description: null,
    startDate: new Date("2026-10-10T18:00:00Z"),
    endDate: new Date("2026-10-10T20:00:00Z"),
    allDay: false,
    color: "blue",
    type: "concert",
    organization: { id: "org-1", name: "The Band", slug: "the-band" },
    createdAt: new Date("2026-10-01T10:00:00Z"),
    createdBy: "marie",
    createdByName: "Marie",
    updatedBy: null,
    place: null,
    ...overrides,
  };
}
