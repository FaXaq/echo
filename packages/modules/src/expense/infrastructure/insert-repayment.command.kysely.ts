import { selectRepayments, toRepayment } from "./common.js";
import type { InsertRepaymentCommandPortFactory } from "./insert-repayment.command.port.js";

export const insertRepaymentCommandFactory: InsertRepaymentCommandPortFactory =
  () => async (db, scope, input) => {
    await db
      .insertInto("repayment")
      .values({
        id: input.id,
        organization_id: scope.organizationId,
        from_user_id: input.fromUserId,
        to_user_id: input.toUserId,
        amount_minor: input.amountMinor,
        paid_on: input.paidOn,
        note: input.note,
        created_by: input.userId,
      })
      .execute();

    const row = await selectRepayments(db, scope)
      .where("id", "=", input.id)
      .executeTakeFirstOrThrow();
    return toRepayment(row);
  };
