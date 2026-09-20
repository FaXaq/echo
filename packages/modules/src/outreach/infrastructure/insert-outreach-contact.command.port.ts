import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachContact } from "../domain/index.js";

export type InsertOutreachContactInput = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
};

export type InsertOutreachContactCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertOutreachContactInput,
) => Promise<OutreachContact>;

export type InsertOutreachContactCommandPortFactory = () => InsertOutreachContactCommandPort;
