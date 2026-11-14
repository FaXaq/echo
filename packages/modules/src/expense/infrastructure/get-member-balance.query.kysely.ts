import { sql } from "kysely";
import type { GetMemberBalanceQueryPortFactory } from "./get-member-balance.query.port.js";

export const getMemberBalanceQueryFactory: GetMemberBalanceQueryPortFactory =
  () => async (db, scope, input) => {
    const { organizationId } = scope;
    const { userId } = input;
    const row = await db
      .selectNoFrom([
        sql<string>`(
          coalesce((select sum(converted_amount_minor) from expense
            where organization_id = ${organizationId} and payer_id = ${userId}), 0)
          - coalesce((select sum(s.converted_amount_minor) from expense_share s
            join expense e on e.id = s.expense_id
            where e.organization_id = ${organizationId} and s.user_id = ${userId}), 0)
          + coalesce((select sum(amount_minor) from repayment
            where organization_id = ${organizationId} and from_user_id = ${userId}), 0)
          - coalesce((select sum(amount_minor) from repayment
            where organization_id = ${organizationId} and to_user_id = ${userId}), 0)
        )`.as("amount_minor"),
      ])
      .executeTakeFirstOrThrow();

    return Number(row.amount_minor);
  };
