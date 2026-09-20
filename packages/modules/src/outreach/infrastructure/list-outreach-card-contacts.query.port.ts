import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachContact } from "../domain/index.js";

export type ListOutreachCardContactsInput = {
  cardId: string;
};

export type ListOutreachCardContactsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListOutreachCardContactsInput,
) => Promise<OutreachContact[]>;

export type ListOutreachCardContactsQueryPortFactory = () => ListOutreachCardContactsQueryPort;
