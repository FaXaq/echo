import type { DeleteRepaymentCommandPortFactory } from "./delete-repayment.command.port.js";

export const deleteRepaymentCommandFactory: DeleteRepaymentCommandPortFactory =
  () => async (db, scope, input) => {
    const result = await db
      .deleteFrom("repayment")
      .where("id", "=", input.id)
      .where("organization_id", "=", scope.organizationId)
      .executeTakeFirst();

    return result.numDeletedRows > 0n;
  };
