import { loadExpenses } from "./common.js";
import type { ListExpensesQueryPortFactory } from "./list-expenses.query.port.js";

export const listExpensesQueryFactory: ListExpensesQueryPortFactory = () => (db, scope, input) =>
  loadExpenses(db, scope, { id: null, eventId: input.eventId });
