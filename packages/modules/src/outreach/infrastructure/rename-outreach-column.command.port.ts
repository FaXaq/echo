import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachColumn } from "../domain/index.js";

export type RenameOutreachColumnInput = {
  id: string;
  name: string;
};

export type RenameOutreachColumnCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: RenameOutreachColumnInput,
) => Promise<OutreachColumn | undefined>;

export type RenameOutreachColumnCommandPortFactory = () => RenameOutreachColumnCommandPort;
