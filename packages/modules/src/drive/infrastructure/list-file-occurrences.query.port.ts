import type { KyselyDB } from "@echo/db";
import type { OrganizationScope } from "@echo/modules/shared/domain";
import type { PlaceLabel } from "../domain/index.js";

export type ListFileOccurrencesQueryInput = { fileIds: string[] };

export type ListFileOccurrencesQueryPort = (
  db: KyselyDB,
  scope: OrganizationScope,
  input: ListFileOccurrencesQueryInput,
) => Promise<Record<string, PlaceLabel[]>>;

export type ListFileOccurrencesQueryPortFactory = () => ListFileOccurrencesQueryPort;
