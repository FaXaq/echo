import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type GetMemberBalanceQueryInput = { userId: string };

export type GetMemberBalanceQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: GetMemberBalanceQueryInput,
) => Promise<number>;

export type GetMemberBalanceQueryPortFactory = () => GetMemberBalanceQueryPort;
