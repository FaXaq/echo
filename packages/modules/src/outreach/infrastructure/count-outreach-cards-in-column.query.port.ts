import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type CountOutreachCardsInColumnInput = {
  columnId: string;
};

export type CountOutreachCardsInColumnQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: CountOutreachCardsInColumnInput,
) => Promise<number>;

export type CountOutreachCardsInColumnQueryPortFactory = () => CountOutreachCardsInColumnQueryPort;
