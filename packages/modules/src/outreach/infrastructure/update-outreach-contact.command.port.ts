import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachContact } from "../domain/index.js";

export type UpdateOutreachContactInput = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  description: string | null;
};

export type UpdateOutreachContactCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdateOutreachContactInput,
) => Promise<OutreachContact | undefined>;

export type UpdateOutreachContactCommandPortFactory = () => UpdateOutreachContactCommandPort;
