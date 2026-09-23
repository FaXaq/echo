import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard } from "../domain/index.js";

export type GetOutreachCardByIdQueryInput = { cardId: string };

export type GetOutreachCardByIdQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: GetOutreachCardByIdQueryInput,
) => Promise<OutreachCard | undefined>;

export type GetOutreachCardByIdQueryPortFactory = () => GetOutreachCardByIdQueryPort;
