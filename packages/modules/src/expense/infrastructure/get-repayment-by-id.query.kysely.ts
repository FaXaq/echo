import { selectRepayments, toRepayment } from "./common.js";
import type { GetRepaymentByIdQueryPortFactory } from "./get-repayment-by-id.query.port.js";

export const getRepaymentByIdQueryFactory: GetRepaymentByIdQueryPortFactory =
  () => async (db, scope, input) => {
    const row = await selectRepayments(db, scope).where("id", "=", input.id).executeTakeFirst();
    return row ? toRepayment(row) : undefined;
  };
