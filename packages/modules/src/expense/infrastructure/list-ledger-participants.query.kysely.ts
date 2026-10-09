import { sql } from "kysely";
import type { ListLedgerParticipantsQueryPortFactory } from "./list-ledger-participants.query.port.js";

export const listLedgerParticipantsQueryFactory: ListLedgerParticipantsQueryPortFactory =
  () => async (db, scope) => {
    const orgId = scope.organizationId;
    const { rows } = await sql<{
      id: string;
      name: string;
      image: string | null;
      is_member: boolean;
    }>`
      select u.id, u.name, u.image,
        exists (
          select 1 from member m where m."userId" = u.id and m."organizationId" = ${orgId}
        ) as is_member
      from "user" u
      where u.id in (
        select "userId" from member where "organizationId" = ${orgId}
        union select payer_id from expense where organization_id = ${orgId}
        union select es.user_id from expense_share es
          join expense e on e.id = es.expense_id where e.organization_id = ${orgId}
        union select from_user_id from repayment where organization_id = ${orgId}
        union select to_user_id from repayment where organization_id = ${orgId}
      )
      order by u.name
    `.execute(db);

    return rows.map((row) => ({
      userId: row.id,
      name: row.name,
      image: row.image,
      isMember: row.is_member,
    }));
  };
