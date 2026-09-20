import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachContact } from "../domain/index.js";

export type ListOutreachContactsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<OutreachContact[]>;

export type ListOutreachContactsQueryPortFactory = () => ListOutreachContactsQueryPort;
