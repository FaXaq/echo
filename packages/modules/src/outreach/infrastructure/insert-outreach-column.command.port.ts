import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachColumn } from "../domain/index.js";

export type InsertOutreachColumnInput = {
  id: string;
  name: string;
  position: number;
};

export type InsertOutreachColumnCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertOutreachColumnInput,
) => Promise<OutreachColumn>;

export type InsertOutreachColumnCommandPortFactory = () => InsertOutreachColumnCommandPort;
