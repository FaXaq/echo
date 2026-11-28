import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { Place } from "../domain/index.js";

export type InsertOccurrencesInput = {
  fileIds: string[];
  place: Place;
  addedBy: string;
};

export type InsertOccurrencesCommandPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: InsertOccurrencesInput,
) => Promise<void>;

export type InsertOccurrencesCommandPortFactory = () => InsertOccurrencesCommandPort;
