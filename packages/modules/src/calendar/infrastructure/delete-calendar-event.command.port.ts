import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";

export type DeleteCalendarEventInput = {
  id: string;
};

export type DeleteCalendarEventCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteCalendarEventInput,
) => Promise<boolean>;

export type DeleteCalendarEventCommandPortFactory = () => DeleteCalendarEventCommandPort;
