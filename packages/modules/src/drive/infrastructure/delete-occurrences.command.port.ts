import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Place } from "../domain/index.js";

export type DeleteOccurrencesInput = { fileIds: string[]; place: Place };

export type DeleteOccurrencesCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: DeleteOccurrencesInput,
) => Promise<string[]>;

export type DeleteOccurrencesCommandPortFactory = () => DeleteOccurrencesCommandPort;
