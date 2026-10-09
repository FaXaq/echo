import { selectRepayments, toRepayment } from "./common.js";
import type { ListRepaymentsQueryPortFactory } from "./list-repayments.query.port.js";

export const listRepaymentsQueryFactory: ListRepaymentsQueryPortFactory =
  () => async (db, scope) => {
    const rows = await selectRepayments(db, scope)
      .orderBy("paid_on", "desc")
      .orderBy("created_at", "desc")
      .execute();
    return rows.map(toRepayment);
  };
