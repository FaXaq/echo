import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard, OutreachPlace } from "../domain/index.js";

export type InsertOutreachCardInput = {
  id: string;
  columnId: string;
  position: number;
  title: string;
  place: OutreachPlace | null;
  description: string | null;
  assigneeId: string | null;
  userId: string;
};

export type InsertOutreachCardCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertOutreachCardInput,
) => Promise<OutreachCard | undefined>;

export type InsertOutreachCardCommandPortFactory = () => InsertOutreachCardCommandPort;
