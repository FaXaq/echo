import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Repayment } from "../domain/index.js";

export type ListRepaymentsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<Repayment[]>;

export type ListRepaymentsQueryPortFactory = () => ListRepaymentsQueryPort;
