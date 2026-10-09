import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type HasLedgerEntriesQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<boolean>;

export type HasLedgerEntriesQueryPortFactory = () => HasLedgerEntriesQueryPort;
