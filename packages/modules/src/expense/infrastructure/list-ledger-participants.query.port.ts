import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { LedgerParticipant } from "../domain/index.js";

export type ListLedgerParticipantsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<LedgerParticipant[]>;

export type ListLedgerParticipantsQueryPortFactory = () => ListLedgerParticipantsQueryPort;
