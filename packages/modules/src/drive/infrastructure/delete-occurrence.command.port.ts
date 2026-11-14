import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Place } from "../domain/index.js";

export type DeleteOccurrenceInput = { fileId: string; place: Place };

export type DeleteOccurrenceCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteOccurrenceInput,
) => Promise<boolean>;

export type DeleteOccurrenceCommandPortFactory = () => DeleteOccurrenceCommandPort;
