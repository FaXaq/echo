import { dbError } from "@echo/errors";
import { loadExpenses, toShareRows } from "./common.js";
import type { InsertExpenseCommandPortFactory } from "./insert-expense.command.port.js";

export const insertExpenseCommandFactory: InsertExpenseCommandPortFactory =
  () => async (db, scope, input) =>
    db.transaction().execute(async (trx) => {
      await trx
        .insertInto("expense")
        .values({
          id: input.id,
          organization_id: scope.organizationId,
          title: input.title,
          description: input.description,
          paid_on: input.paidOn,
          amount_minor: input.amountMinor,
          currency: input.currency,
          exchange_rate: input.exchangeRate,
          converted_amount_minor: input.convertedAmountMinor,
          split_mode: input.splitMode,
          payer_id: input.payerId,
          event_id: input.eventId,
          created_by: input.userId,
          updated_by: input.userId,
        })
        .execute();
      await trx.insertInto("expense_share").values(toShareRows(input.id, input.shares)).execute();

      const [expense] = await loadExpenses(trx, scope, { id: input.id, eventId: null });
      if (!expense) throw dbError("Inserted expense could not be read back");
      return expense;
    });
