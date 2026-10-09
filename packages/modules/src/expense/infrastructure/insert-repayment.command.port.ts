import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Repayment, RepaymentFields } from "../domain/index.js";

export type InsertRepaymentInput = RepaymentFields & { id: string; userId: string };

export type InsertRepaymentCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertRepaymentInput,
) => Promise<Repayment>;

export type InsertRepaymentCommandPortFactory = () => InsertRepaymentCommandPort;
