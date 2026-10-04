import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Repayment, RepaymentFields } from "../domain/index.js";

export type UpdateRepaymentInput = RepaymentFields & { id: string };

export type UpdateRepaymentCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdateRepaymentInput,
) => Promise<Repayment | undefined>;

export type UpdateRepaymentCommandPortFactory = () => UpdateRepaymentCommandPort;
