import type { KyselyDB } from "@echo/db";
import { forbidden } from "@echo/errors";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { CheckOrganizationPermission } from "@echo/modules/user/infrastructure";
import {
  computeBalances,
  suggestRepayments,
  type Balance,
  type LedgerParticipant,
  type SuggestedRepayment,
} from "../domain/index.js";
import type { GetOrganizationCurrencyQueryPort } from "../infrastructure/get-organization-currency.query.port.js";
import type { ListExpensesQueryPort } from "../infrastructure/list-expenses.query.port.js";
import type { ListLedgerParticipantsQueryPort } from "../infrastructure/list-ledger-participants.query.port.js";
import type { ListRepaymentsQueryPort } from "../infrastructure/list-repayments.query.port.js";

export type LedgerSummary = {
  currency: string;
  participants: LedgerParticipant[];
  balances: Balance[];
  suggestedRepayments: SuggestedRepayment[];
};

export async function getLedgerSummary(
  deps: {
    db: KyselyDB;
    userHasPermissionInOrganization: CheckOrganizationPermission;
    listExpensesQuery: ListExpensesQueryPort;
    listRepaymentsQuery: ListRepaymentsQueryPort;
    listLedgerParticipantsQuery: ListLedgerParticipantsQueryPort;
    getOrganizationCurrencyQuery: GetOrganizationCurrencyQueryPort;
  },
  input: { scope: OrganizationScope },
): Promise<LedgerSummary> {
  const { success } = await deps.userHasPermissionInOrganization({
    organizationId: input.scope.organizationId,
    permissions: { expense: ["read"] },
  });
  if (!success) throw forbidden({ entity: "Expense", action: "read" });

  const [expenses, repayments, participants, currency] = await Promise.all([
    deps.listExpensesQuery(deps.db, input.scope, { eventId: null }),
    deps.listRepaymentsQuery(deps.db, input.scope),
    deps.listLedgerParticipantsQuery(deps.db, input.scope),
    deps.getOrganizationCurrencyQuery(deps.db, input.scope),
  ]);

  const computed = new Map(
    computeBalances({ expenses, repayments }).map((balance) => [
      balance.userId,
      balance.amountMinor,
    ]),
  );
  const balances = participants
    .map((participant) => ({
      userId: participant.userId,
      amountMinor: computed.get(participant.userId) ?? 0,
    }))
    .sort((a, b) => b.amountMinor - a.amountMinor || a.userId.localeCompare(b.userId));

  return { currency, participants, balances, suggestedRepayments: suggestRepayments(balances) };
}
