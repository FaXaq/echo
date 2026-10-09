import { loadExpenses } from "./common.js";
import type { GetExpenseByIdQueryPortFactory } from "./get-expense-by-id.query.port.js";

export const getExpenseByIdQueryFactory: GetExpenseByIdQueryPortFactory =
  () => async (db, scope, input) => {
    const [expense] = await loadExpenses(db, scope, { id: input.id, eventId: null });
    return expense;
  };
