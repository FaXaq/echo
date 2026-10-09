import { sql } from "kysely";
import { selectRepayments, toRepayment } from "./common.js";
import type { UpdateRepaymentCommandPortFactory } from "./update-repayment.command.port.js";

export const updateRepaymentCommandFactory: UpdateRepaymentCommandPortFactory =
  () => async (db, scope, input) => {
    const updated = await db
      .updateTable("repayment")
      .set({
        from_user_id: input.fromUserId,
        to_user_id: input.toUserId,
        amount_minor: input.amountMinor,
        paid_on: sql<Date>`${input.paidOn}::date`,
        note: input.note,
      })
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .returning("id")
      .executeTakeFirst();
    if (!updated) return undefined;

    const row = await selectRepayments(db, scope)
      .where("id", "=", input.id)
      .executeTakeFirstOrThrow();
    return toRepayment(row);
  };
