import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { OutreachCard } from "../domain/index.js";

export type UpdateOutreachCardDescriptionInput = {
  id: string;
  userId: string;
  description: string | null;
};

export type UpdateOutreachCardDescriptionCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: UpdateOutreachCardDescriptionInput,
) => Promise<OutreachCard | undefined>;

export type UpdateOutreachCardDescriptionCommandPortFactory =
  () => UpdateOutreachCardDescriptionCommandPort;
