import type { KyselyDB } from "@echo/db";
import { notFound } from "@echo/errors";
import type { GetCalendarEventByIdQueryPort } from "@echo/modules/calendar/infrastructure";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import {
  buildExpenseShares,
  convertAmount,
  currencyExponent,
  invalidLedgerEntry,
  isSupportedCurrency,
  parseExchangeRate,
  type ExpenseFields,
  type SplitInput,
} from "../domain/index.js";
import type { GetOrganizationCurrencyQueryPort } from "../infrastructure/get-organization-currency.query.port.js";
import type { ListOrganizationMemberIdsQueryPort } from "../infrastructure/list-organization-member-ids.query.port.js";

export type ExpenseDraft = {
  title: string;
  description: string | null;
  paidOn: string;
  amountMinor: number;
  currency: string;
  exchangeRate: string | null;
  payerId: string;
  eventId: string | null;
  split: SplitInput;
};

export async function prepareExpense(
  deps: {
    db: KyselyDB;
    getOrganizationCurrencyQuery: GetOrganizationCurrencyQueryPort;
    listOrganizationMemberIdsQuery: ListOrganizationMemberIdsQueryPort;
    getCalendarEventByIdQuery: GetCalendarEventByIdQueryPort;
  },
  input: { scope: OrganizationScope; draft: ExpenseDraft; keepUserIds: string[] },
): Promise<ExpenseFields> {
  const { draft, scope } = input;
  if (!isSupportedCurrency(draft.currency)) {
    throw invalidLedgerEntry("Expense", "Unsupported currency");
  }

  const organizationCurrency = await deps.getOrganizationCurrencyQuery(deps.db, scope);
  let exchangeRate: string | null = null;
  let convertedAmountMinor = draft.amountMinor;
  if (draft.currency !== organizationCurrency) {
    if (draft.exchangeRate === null) {
      throw invalidLedgerEntry("Expense", "An exchange rate is required for a foreign currency");
    }
    exchangeRate = parseExchangeRate(draft.exchangeRate);
    convertedAmountMinor = convertAmount({
      amountMinor: draft.amountMinor,
      fromExponent: currencyExponent(draft.currency),
      toExponent: currencyExponent(organizationCurrency),
      rate: exchangeRate,
    });
  }

  const shares = buildExpenseShares({
    amountMinor: draft.amountMinor,
    convertedAmountMinor,
    payerId: draft.payerId,
    split: draft.split,
  });

  const memberIds = await deps.listOrganizationMemberIdsQuery(deps.db, scope);
  const allowed = new Set([...memberIds, ...input.keepUserIds]);
  if (![draft.payerId, ...shares.map((share) => share.userId)].every((id) => allowed.has(id))) {
    throw invalidLedgerEntry("Expense", "Payer and share holders must be organization members");
  }

  if (draft.eventId !== null) {
    const event = await deps.getCalendarEventByIdQuery(deps.db, scope, { eventId: draft.eventId });
    if (!event) throw notFound("CalendarEvent");
  }

  return {
    title: draft.title,
    description: draft.description,
    paidOn: draft.paidOn,
    amountMinor: draft.amountMinor,
    currency: draft.currency,
    exchangeRate,
    convertedAmountMinor,
    splitMode: draft.split.mode,
    payerId: draft.payerId,
    eventId: draft.eventId,
    shares,
  };
}
