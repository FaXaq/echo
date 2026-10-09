import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Repayment } from "../domain/index.js";

export type GetRepaymentByIdInput = { id: string };

export type GetRepaymentByIdQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: GetRepaymentByIdInput,
) => Promise<Repayment | undefined>;

export type GetRepaymentByIdQueryPortFactory = () => GetRepaymentByIdQueryPort;
