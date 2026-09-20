import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Contact } from "../domain/index.js";

export type InsertContactInput = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
};

export type InsertContactCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertContactInput,
) => Promise<Contact>;

export type InsertContactCommandPortFactory = () => InsertContactCommandPort;
