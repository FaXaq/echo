import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import { MAX_AMOUNT_MINOR, invalidLedgerEntry, type RepaymentFields } from "../domain/index.js";
import type { ListOrganizationMemberIdsQueryPort } from "../infrastructure/list-organization-member-ids.query.port.js";

export type RepaymentDraft = RepaymentFields;

export async function prepareRepayment(
  deps: { db: KyselyDB; listOrganizationMemberIdsQuery: ListOrganizationMemberIdsQueryPort },
  input: { scope: OrganizationScope; draft: RepaymentDraft; keepUserIds: string[] },
): Promise<RepaymentFields> {
  const { draft } = input;
  if (
    !Number.isInteger(draft.amountMinor) ||
    draft.amountMinor <= 0 ||
    draft.amountMinor > MAX_AMOUNT_MINOR
  ) {
    throw invalidLedgerEntry(
      "Repayment",
      "Amount must be a positive whole number within the limit",
    );
  }
  if (draft.fromUserId === draft.toUserId) {
    throw invalidLedgerEntry("Repayment", "A repayment needs two different people");
  }

  const memberIds = await deps.listOrganizationMemberIdsQuery(deps.db, input.scope);
  const allowed = new Set([...memberIds, ...input.keepUserIds]);
  if (!allowed.has(draft.fromUserId) || !allowed.has(draft.toUserId)) {
    throw invalidLedgerEntry("Repayment", "Both people must be organization members");
  }

  return {
    fromUserId: draft.fromUserId,
    toUserId: draft.toUserId,
    amountMinor: draft.amountMinor,
    paidOn: draft.paidOn,
    note: draft.note,
  };
}
