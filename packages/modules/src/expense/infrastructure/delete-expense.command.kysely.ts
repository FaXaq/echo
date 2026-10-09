import type { DeleteExpenseCommandPortFactory } from "./delete-expense.command.port.js";

export const deleteExpenseCommandFactory: DeleteExpenseCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .deleteFrom("expense")
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
