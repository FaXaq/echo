import { sql } from "kysely";
import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Expense, Repayment, Share, SplitMode } from "../domain/index.js";

const toSplitMode = (value: string): SplitMode => (value === "exact" ? "exact" : "equal");

export async function loadExpenses(
  db: KyselyDB,
  scope: OrganizationScope,
  filter: { id: string | null; eventId: string | null },
): Promise<Expense[]> {
  let query = db
    .selectFrom("expense")
    .select([
      "id",
      "organization_id",
      "title",
      "description",
      "amount_minor",
      "currency",
      "exchange_rate",
      "converted_amount_minor",
      "split_mode",
      "payer_id",
      "event_id",
      "created_by",
      "created_at",
      "updated_at",
      sql<string>`to_char(paid_on, 'YYYY-MM-DD')`.as("paid_on"),
    ])
    .where("organization_id", "=", scope.organizationId);
  if (filter.id !== null) query = query.where("id", "=", filter.id);
  if (filter.eventId !== null) query = query.where("event_id", "=", filter.eventId);
  const rows = await query.orderBy("paid_on", "desc").orderBy("created_at", "desc").execute();

  const shareRows =
    rows.length === 0
      ? []
      : await db
          .selectFrom("expense_share")
          .select(["expense_id", "user_id", "amount_minor", "converted_amount_minor"])
          .where(
            "expense_id",
            "in",
            rows.map((row) => row.id),
          )
          .orderBy("user_id")
          .execute();

  const sharesByExpense = new Map<string, Share[]>();
  for (const row of shareRows) {
    const shares = sharesByExpense.get(row.expense_id) ?? [];
    shares.push({
      userId: row.user_id,
      amountMinor: row.amount_minor,
      convertedAmountMinor: row.converted_amount_minor,
    });
    sharesByExpense.set(row.expense_id, shares);
  }

  return rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    title: row.title,
    description: row.description,
    paidOn: row.paid_on,
    amountMinor: row.amount_minor,
    currency: row.currency,
    exchangeRate: row.exchange_rate,
    convertedAmountMinor: row.converted_amount_minor,
    splitMode: toSplitMode(row.split_mode),
    payerId: row.payer_id,
    eventId: row.event_id,
    createdBy: row.created_by,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    shares: sharesByExpense.get(row.id) ?? [],
  }));
}

export const toShareRows = (expenseId: string, shares: Share[]) =>
  shares.map((share) => ({
    expense_id: expenseId,
    user_id: share.userId,
    amount_minor: share.amountMinor,
    converted_amount_minor: share.convertedAmountMinor,
  }));

export const selectRepayments = (db: KyselyDB, scope: OrganizationScope) =>
  db
    .selectFrom("repayment")
    .select([
      "id",
      "organization_id",
      "from_user_id",
      "to_user_id",
      "amount_minor",
      "note",
      "created_by",
      "created_at",
      sql<string>`to_char(paid_on, 'YYYY-MM-DD')`.as("paid_on"),
    ])
    .where("organization_id", "=", scope.organizationId);

type RepaymentRow = {
  id: string;
  organization_id: string;
  from_user_id: string;
  to_user_id: string;
  amount_minor: number;
  paid_on: string;
  note: string | null;
  created_by: string;
  created_at: Date;
};

export const toRepayment = (row: RepaymentRow): Repayment => ({
  id: row.id,
  organizationId: row.organization_id,
  fromUserId: row.from_user_id,
  toUserId: row.to_user_id,
  amountMinor: row.amount_minor,
  paidOn: row.paid_on,
  note: row.note,
  createdBy: row.created_by,
  createdAt: row.created_at,
});
