import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type LinkOutreachContactToCardInput = {
  cardId: string;
  contactId: string;
};

export type LinkOutreachContactToCardCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: LinkOutreachContactToCardInput,
) => Promise<void>;

export type LinkOutreachContactToCardCommandPortFactory =
  () => LinkOutreachContactToCardCommandPort;
