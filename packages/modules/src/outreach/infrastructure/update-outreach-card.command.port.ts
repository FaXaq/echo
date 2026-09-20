import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard, OutreachPlace } from "../domain/index.js";

export type UpdateOutreachCardInput = {
  id: string;
  title: string;
  place: OutreachPlace | null;
  description: string | null;
  assigneeId: string | null;
  userId: string;
};

export type UpdateOutreachCardCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdateOutreachCardInput,
) => Promise<OutreachCard | undefined>;

export type UpdateOutreachCardCommandPortFactory = () => UpdateOutreachCardCommandPort;
