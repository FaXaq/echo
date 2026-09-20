import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type MoveOutreachCardInput = {
  id: string;
  columnId: string;
  position: number;
};

export type MoveOutreachCardCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: MoveOutreachCardInput,
) => Promise<boolean>;

export type MoveOutreachCardCommandPortFactory = () => MoveOutreachCardCommandPort;
