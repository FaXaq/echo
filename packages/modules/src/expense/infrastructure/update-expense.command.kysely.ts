import { sql } from "kysely";
import { loadExpenses, toShareRows } from "./common.js";
import type { UpdateExpenseCommandPortFactory } from "./update-expense.command.port.js";

export const updateExpenseCommandFactory: UpdateExpenseCommandPortFactory =
  () => async (db, scope, input) =>
    db.transaction().execute(async (trx) => {
      const updated = await trx
        .updateTable("expense")
        .set({
          title: input.title,
          description: input.description,
          paid_on: sql<Date>`${input.paidOn}::date`,
          amount_minor: input.amountMinor,
          currency: input.currency,
          exchange_rate: input.exchangeRate,
          converted_amount_minor: input.convertedAmountMinor,
          split_mode: input.splitMode,
          payer_id: input.payerId,
          event_id: input.eventId,
          updated_by: input.userId,
          updated_at: new Date(),
        })
        .where("id", "=", input.id)
        .where("organization_id", "=", scope.organizationId)
        .returning("id")
        .executeTakeFirst();
      if (!updated) return undefined;

      await trx.deleteFrom("expense_share").where("expense_id", "=", input.id).execute();
      await trx.insertInto("expense_share").values(toShareRows(input.id, input.shares)).execute();

      const [expense] = await loadExpenses(trx, scope, { id: input.id, eventId: null });
      return expense;
    });
