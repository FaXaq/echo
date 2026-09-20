import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type UnlinkOutreachContactFromCardInput = {
  cardId: string;
  contactId: string;
};

export type UnlinkOutreachContactFromCardCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UnlinkOutreachContactFromCardInput,
) => Promise<void>;

export type UnlinkOutreachContactFromCardCommandPortFactory =
  () => UnlinkOutreachContactFromCardCommandPort;
