import type { KyselyDB } from "@echo/db";

export type DeleteCalendarEventInput = {
  id: string;
  organizationId: string;
};

export type DeleteCalendarEventCommandPort = (
  db: KyselyDB,
  input: DeleteCalendarEventInput,
) => Promise<boolean>;

export type DeleteCalendarEventCommandPortFactory = () => DeleteCalendarEventCommandPort;
