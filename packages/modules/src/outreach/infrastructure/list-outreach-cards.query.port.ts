import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard } from "../domain/index.js";

export type ListOutreachCardsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<OutreachCard[]>;

export type ListOutreachCardsQueryPortFactory = () => ListOutreachCardsQueryPort;
