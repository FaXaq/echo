import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachColumn } from "../domain/index.js";

export type ListOutreachColumnsQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
) => Promise<OutreachColumn[]>;

export type ListOutreachColumnsQueryPortFactory = () => ListOutreachColumnsQueryPort;
