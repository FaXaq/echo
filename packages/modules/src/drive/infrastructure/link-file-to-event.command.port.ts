import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type LinkFileToEventInput = {
  eventId: string;
  fileId: string;
};

export type LinkFileToEventCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: LinkFileToEventInput,
) => Promise<boolean>;

export type LinkFileToEventCommandPortFactory = () => LinkFileToEventCommandPort;
