import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type MoveOutreachColumnInput = {
  id: string;
  position: number;
};

export type MoveOutreachColumnCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: MoveOutreachColumnInput,
) => Promise<boolean>;

export type MoveOutreachColumnCommandPortFactory = () => MoveOutreachColumnCommandPort;
