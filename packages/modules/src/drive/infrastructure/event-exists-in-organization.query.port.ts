import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type EventExistsInOrganizationInput = { eventId: string };

export type EventExistsInOrganizationQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: EventExistsInOrganizationInput,
) => Promise<boolean>;

export type EventExistsInOrganizationQueryPortFactory = () => EventExistsInOrganizationQueryPort;
