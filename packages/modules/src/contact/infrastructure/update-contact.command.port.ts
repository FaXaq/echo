import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Contact } from "../domain/index.js";

export type UpdateContactInput = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
};

export type UpdateContactCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdateContactInput,
) => Promise<Contact | undefined>;

export type UpdateContactCommandPortFactory = () => UpdateContactCommandPort;
